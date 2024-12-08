"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";

interface Stock {
  productName: string;
  price: number;
  location: string;
  dateOfPurchase: string;
  quantity: number;
}

export default function StockPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [newStock, setNewStock] = useState<Stock>({
    productName: "",
    price: 0,
    location: "",
    dateOfPurchase: "",
    quantity: 0,
  
  });
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/checkAuth");
        if (!response.ok) throw new Error("Not authenticated");
        const userData = await response.json();
        setUser(userData);
      } catch {
        setError("You need to log in.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch("/api/getUserInfo");
        if (!response.ok) throw new Error("Failed to fetch stock data");
        const data = await response.json();
        setStocks(data.stocks || []);
      } catch {
        setError("Failed to fetch stock data");
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, []);

  const deleteStock = async (productName: string) => {
    try {
      const response = await fetch("/api/deleteStockInfo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      if (!response.ok) throw new Error();
      setStocks(
        (prev) => prev?.filter((s) => s.productName !== productName) || []
      );
    } catch {
      setError("Failed to delete stock");
    }
  };

  const addStock = async () => {
    try {
      const response = await fetch("/api/addStockInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStock),
      });
      if (!response.ok) throw new Error();
      setStocks((prev) => (prev ? [...prev, newStock] : [newStock]));
      setNewStock({
        productName: "",
        price: 0,
        location: "",
        dateOfPurchase: "",
        quantity: 0,
      });
    } catch {
      setError("Failed to add stock");
    }
  };

  const editStock = async () => {
    if (!editingStock) return;
    try {
      const response = await fetch("/api/editStockInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStock),
      });
      if (!response.ok) throw new Error();
      setStocks(
        (prev) =>
          prev?.map((s) =>
            s.productName === editingStock.productName ? editingStock : s
          ) || []
      );
      setEditingStock(null);
    } catch {
      setError("Failed to edit stock");
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="font-inter text-gray-800 flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="w-full md:w-[calc(100%-256px)] md:ml-64 bg-white p-8">
        {/* Page Header */}
        <h1 className="text-3xl font-bold mb-8">Stocks</h1>

        {/* Add New Stock */}
        <section className="mb-12">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addStock();
              }}
              className="flex flex-wrap gap-4"
            >
              <input
                type="text"
                placeholder="Product Name"
                value={newStock.productName}
                onChange={(e) =>
                  setNewStock({ ...newStock, productName: e.target.value })
                }
                className="flex-1 border p-2 rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newStock.price}
                onChange={(e) =>
                  setNewStock({
                    ...newStock,
                    price: parseFloat(e.target.value),
                  })
                }
                className="flex-1 border p-2 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={newStock.location}
                onChange={(e) =>
                  setNewStock({ ...newStock, location: e.target.value })
                }
                className="flex-1 border p-2 rounded-md"
                required
              />
              <input
                type="date"
                placeholder="Date of Purchase"
                value={newStock.dateOfPurchase}
                onChange={(e) =>
                  setNewStock({ ...newStock, dateOfPurchase: e.target.value })
                }
                className="flex-1 border p-2 rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={newStock.quantity}
                onChange={(e) =>
                  setNewStock({
                    ...newStock,
                    quantity: parseInt(e.target.value),
                  })
                }
                className="flex-1 border p-2 rounded-md"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
              >
                Add Stock
              </button>
            </form>
          </div>
        </section>

        {/* Edit Stock */}
        {editingStock && (
          <section className="mb-12">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Edit Stock</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editStock();
                }}
                className="flex flex-wrap gap-4"
              >
                <input
                  type="text"
                  placeholder="Product Name"
                  value={editingStock.productName}
                  onChange={(e) =>
                    setEditingStock({
                      ...editingStock,
                      productName: e.target.value,
                    })
                  }
                  className="flex-1 border p-2 rounded-md"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={editingStock.price}
                  onChange={(e) =>
                    setEditingStock({
                      ...editingStock,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="flex-1 border p-2 rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={editingStock.location}
                  onChange={(e) =>
                    setEditingStock({
                      ...editingStock,
                      location: e.target.value,
                    })
                  }
                  className="flex-1 border p-2 rounded-md"
                  required
                />
                <input
                  type="date"
                  placeholder="Date of Purchase"
                  value={editingStock.dateOfPurchase}
                  onChange={(e) =>
                    setEditingStock({
                      ...editingStock,
                      dateOfPurchase: e.target.value,
                    })
                  }
                  className="flex-1 border p-2 rounded-md"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={editingStock.quantity}
                  onChange={(e) =>
                    setEditingStock({
                      ...editingStock,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 border p-2 rounded-md"
                  required
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStock(null)}
                    className="px-6 py-2 bg-gray-400 text-white rounded-md shadow-md hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Stock List */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Stock List</h2>
          {stocks && stocks.length > 0 ? (
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">Product Name</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Date of Purchase</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr
                    key={s.productName}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{s.productName}</td>
                    <td className="px-4 py-2">${s.price}</td>
                    <td className="px-4 py-2">{s.location}</td>
                    <td className="px-4 py-2">{s.dateOfPurchase}</td>
                    <td className="px-4 py-2">{s.quantity}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => setEditingStock(s)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteStock(s.productName)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-600">
              No stock data available.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
