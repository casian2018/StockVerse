import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "../mongodb";
import { Automation } from "@/lib/automations";
import { differenceInDays } from "date-fns";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { sendAutomationEmail } from "@/lib/mailer";

const JWT_SECRET = process.env.JWT_SECRET;

async function getContext(req: NextApiRequest) {
  if (!JWT_SECRET) throw new Error("JWT secret missing");
  const token = req.cookies.token;
  if (!token) return null;
  const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
  const client = await clientPromise;
  const db = client.db("stock_verse");
  const users = db.collection("users");
  const user = await users.findOne({ email: decoded.email });
  return { user, db, users };
}

const supportedMetrics = [
  "overdue_tasks",
  "completion_rate",
  "headcount",
  "upcoming_birthdays",
] as const;

type SupportedMetric = (typeof supportedMetrics)[number];

function evaluateComparator(
  value: number,
  comparator: string | undefined,
  threshold: number | undefined
) {
  if (threshold === undefined) return false;
  switch (comparator) {
    case "above":
      return value > threshold;
    case "below":
      return value < threshold;
    case "equals":
      return value === threshold;
    default:
      return false;
  }
}

async function createTaskFromAction(
  automation: Automation,
  usersCollection: any,
  business: string
) {
  const template = automation.action.task;
  if (!template) return null;
  const ownerEmail = automation.ownerEmail;
  const userDoc = await usersCollection.findOne({
    email: ownerEmail,
    business,
  });
  if (!userDoc) return null;

  const deadline =
    template.deadlineOffsetDays !== undefined
      ? new Date(
          Date.now() + template.deadlineOffsetDays * 24 * 60 * 60 * 1000
        )
      : new Date();

  const task = {
    id: crypto.randomUUID(),
    title: template.title,
    description: template.description || automation.description || "",
    assignees: [ownerEmail],
    deadline: deadline.toISOString().slice(0, 10),
    completed: false,
    subtasks: [],
    status: "Todo",
    priority: template.priority || "Medium",
    createdAt: new Date().toISOString(),
  };

  await usersCollection.updateOne(
    { email: ownerEmail },
    { $push: { tasks: task } }
  );
  return task;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ctx = await getContext(req);
    if (!ctx || !ctx.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { user, db, users } = ctx;

    if (user.role !== "Admin") {
      return res.status(403).json({ error: "Admins only" });
    }

    // Check business plan for automations availability (Pro+)
    const ownerDoc = await users.findOne({ business: user.business, role: 'Admin' }, { projection: { subscription: 1 } });
    const ownerPlanId = ownerDoc?.subscription?.planId || user.subscription?.planId || 'basic';
    const automationsAllowed = ownerPlanId === 'pro' || ownerPlanId === 'enterprise';
    if (!automationsAllowed) {
      return res.status(403).json({ error: 'Automations are available on Pro and Enterprise plans.' });
    }

    const { automationId } = req.body as { automationId?: string };
    const automationsCol = db.collection("automations");
    const alertsCol = db.collection("automation_alerts");

    const automationQuery = automationId
      ? { _id: new ObjectId(automationId), business: user.business }
      : { business: user.business, active: true };

    const rawList = await automationsCol.find(automationQuery).toArray();
    const automationList: Automation[] = rawList.map((doc: any) => ({
      ...doc,
      _id: doc._id?.toString(),
    }));

    const orgUsers = await users
      .find(
        { business: user.business },
        { projection: { tasks: 1, personal: 1, email: 1, role: 1, profilename: 1 } }
      )
      .toArray();

    const personalRecords = orgUsers.flatMap((u: any) => u.personal || []);
    const tasks = orgUsers.flatMap((u: any) => u.tasks || []);
    const now = new Date();

    const overdueTasks = tasks.filter((task: any) => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return (
        deadline < now &&
        task.status !== "Completed" &&
        task.completed !== true
      );
    }).length;

    const completedTasks = tasks.filter(
      (task: any) => task.status === "Completed" || task.completed
    ).length;
    const completionRate =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const upcomingBirthdays = personalRecords.filter((person: any) => {
      if (!person.birthDate) return false;
      const birth = new Date(person.birthDate);
      const birthdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      const diff = differenceInDays(birthdayThisYear, now);
      if (diff < 0) {
        const nextYear = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
        return differenceInDays(nextYear, now) <= 14;
      }
      return diff <= 14;
    }).length;

    const metricSnapshot: Record<SupportedMetric, number> = {
      overdue_tasks: overdueTasks,
      completion_rate: completionRate,
      headcount: personalRecords.length,
      upcoming_birthdays: upcomingBirthdays,
    };

    const triggered: Array<{ automation: Automation; message: string }> = [];

    for (const automation of automationList) {
      if (!automation.trigger || !automation.action) continue;
      let shouldTrigger = false;
      let message = automation.action.message || automation.name;

      if (automation.trigger.type === "kpi") {
        const metricId = automation.trigger.metricId as SupportedMetric;
        if (!metricId || !supportedMetrics.includes(metricId)) continue;
        const value = metricSnapshot[metricId];
        shouldTrigger = evaluateComparator(
          value,
          automation.trigger.comparator,
          automation.trigger.threshold
        );
        if (shouldTrigger) {
          message =
            message ||
            `${metricId} is ${automation.trigger.comparator} threshold (${value}).`;
        }
      } else if (automation.trigger.type === "date") {
        const field = automation.trigger.dateField;
        if (!field) continue;
        const offset = automation.trigger.offsetDays ?? 0;
        const matches = personalRecords.filter((person: any) => {
          const dateValue = person[field];
          if (!dateValue) return false;
          let target = new Date(dateValue);
          if (field === "birthDate") {
            target = new Date(
              now.getFullYear(),
              target.getMonth(),
              target.getDate()
            );
            if (target < now) {
              target = new Date(
                now.getFullYear() + 1,
                target.getMonth(),
                target.getDate()
              );
            }
          }
          const diff = differenceInDays(target, now);
          return diff >= 0 && diff <= offset;
        });
        shouldTrigger = matches.length > 0;
        if (shouldTrigger) {
          message =
            message ||
            `${matches.length} team member(s) have ${field} within ${offset} day(s).`;
        }
      }

      if (!shouldTrigger) continue;

      const targetRoles =
        automation.visibilityRoles && automation.visibilityRoles.length > 0
          ? automation.visibilityRoles
          : ["Admin"];
      const recipients = Array.from(
        new Set(
          orgUsers
            .filter(
              (member: any) =>
                member.email && member.role && targetRoles.includes(member.role)
            )
            .map((member: any) => member.email)
            .concat(automation.ownerEmail || [])
            .filter(Boolean)
        )
      ) as string[];

      const alertDoc = {
        business: user.business,
        automationId: automation._id?.toString() || "",
        message,
        roles: targetRoles,
        createdAt: new Date().toISOString(),
        action: automation.action,
        readBy: [] as string[],
        metadata: { metricSnapshot, recipients },
      };

      await alertsCol.insertOne(alertDoc);
      if (automation.action.type === "task") {
        await createTaskFromAction(automation, users, user.business);
      }

      if (automation.action.type === "email" || automation.action.email) {
        const emailSubject =
          automation.action.email?.subject ||
          automation.action.message ||
          automation.name;
        const emailBody =
          automation.action.email?.body || message || automation.description || "";
        await sendAutomationEmail({
          to: recipients,
          subject: emailSubject,
          text: emailBody,
        });
      }
      triggered.push({ automation, message });

      if (automation._id) {
        await automationsCol.updateOne(
          { _id: new ObjectId(automation._id) },
          {
            $set: {
              lastRunAt: new Date().toISOString(),
              lastRunStatus: "triggered",
            },
          }
        );
      }
    }

    return res.status(200).json({
      triggered: triggered.length,
      details: triggered,
      metrics: metricSnapshot,
    });
  } catch (error: any) {
    console.error("Automation run error:", error);
    return res.status(500).json({ error: "Failed to run automations" });
  }
}
