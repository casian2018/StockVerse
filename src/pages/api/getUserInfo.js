import clientPromise from './mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function isSubscriptionActiveRecord(subscription) {
  if (!subscription) return false;
  if (subscription.status === 'active') return true;
  if (
    subscription.status === 'trial' &&
    subscription.trialEndsAt &&
    new Date(subscription.trialEndsAt) > new Date()
  ) {
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await clientPromise;
    const db = client.db('stock_verse');
    const users = db.collection('users');

    const user = await users.findOne({ email: decoded.email }, { projection: { password: 0 } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const legalnames = user.personal?.map((person) => person.legalname) || [];
    const profiles = db.collection('business_profiles');
    const businessProfile = user.business
      ? await profiles.findOne({ business: user.business })
      : null;

    let businessOwner = user;
    if (user.role !== 'Admin' && user.business) {
      const ownerDoc = await users.findOne(
        { business: user.business, role: 'Admin' },
        { projection: { email: 1, subscription: 1 } }
      );
      if (ownerDoc) {
        businessOwner = ownerDoc;
      }
    }

    const businessSubscriptionActive = isSubscriptionActiveRecord(
      businessOwner?.subscription
    );
    const businessSubscriptionOwner = businessOwner?.email || null;
    const businessSubscriptionPlanId = businessOwner?.subscription?.planId || null;

    res.status(200).json({
      ...user,
      legalnames,
      businessSubscriptionActive,
      businessSubscriptionOwner,
      businessSubscriptionPlanId,
      country: businessProfile?.country || null,
      currency: businessProfile?.currency || null,
      locale: businessProfile?.locale || null,
    });
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
}
