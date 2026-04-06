"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"settings" | "categories" | "users">("settings");
  const [forumName, setForumName] = useState("");
  const [forumDescription, setForumDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatOrder, setNewCatOrder] = useState(0);
  const [makeAdminUsername, setMakeAdminUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        setForumName(data.name || "");
        setForumDescription(data.description || "");
      });
    loadCategories();
  }, []);

  const loadCategories = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data));
  };

  const showMsg = (msg: string) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 3000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setMessage("");
  };

  const saveConfig = async () => {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: forumName, description: forumDescription }),
    });
    if (res.ok) {
      showMsg("Forum settings saved!");
      router.refresh();
    } else {
      showErr("Failed to save settings");
    }
  };

  const createCategory = async () => {
    if (!newCatName.trim()) {
      showErr("Category name is required");
      return;
    }
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        name: newCatName,
        description: newCatDesc,
        sort_order: newCatOrder,
      }),
    });
    if (res.ok) {
      showMsg("Category created!");
      setNewCatName("");
      setNewCatDesc("");
      setNewCatOrder(0);
      loadCategories();
    } else {
      showErr("Failed to create category");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (res.ok) {
      showMsg("Category deleted!");
      loadCategories();
    } else {
      showErr("Failed to delete category");
    }
  };

  const makeAdmin = async () => {
    if (!makeAdminUsername.trim()) {
      showErr("Username is required");
      return;
    }
    const res = await fetch("/api/admin/make-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: makeAdminUsername }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(`${data.username} is now an admin!`);
      setMakeAdminUsername("");
    } else {
      showErr(data.error || "Failed to make admin");
    }
  };

  const tabs = [
    { id: "settings" as const, label: "Forum Settings" },
    { id: "categories" as const, label: "Categories" },
    { id: "users" as const, label: "Users" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #800000",
          marginBottom: 12,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 20px",
              fontSize: 12,
              fontFamily: '"Trebuchet MS", Arial, sans-serif',
              fontWeight: "bold",
              background: activeTab === tab.id ? "#800000" : "#E4D5CA",
              color: activeTab === tab.id ? "white" : "#333",
              border: "1px solid #D9BFB7",
              borderBottom: activeTab === tab.id ? "1px solid #800000" : "1px solid #D9BFB7",
              cursor: "pointer",
              marginRight: 2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          style={{
            padding: "8px 12px",
            background: "#F0FFF0",
            border: "1px solid #4CAF50",
            color: "#2E7D32",
            fontSize: 11,
            marginBottom: 12,
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            background: "#FFF0F0",
            border: "1px solid #CC3333",
            color: "#CC3333",
            fontSize: 11,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          <div className="category-header">Forum Settings</div>
          <table className="forum-table">
            <tbody>
              <tr>
                <td style={{ width: "25%", fontWeight: "bold", fontSize: 11 }}>Forum Name</td>
                <td>
                  <input
                    className="forum-input"
                    value={forumName}
                    onChange={(e) => setForumName(e.target.value)}
                    style={{ maxWidth: 400 }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", fontSize: 11 }}>Description</td>
                <td>
                  <textarea
                    className="forum-textarea"
                    value={forumDescription}
                    onChange={(e) => setForumDescription(e.target.value)}
                    style={{ maxWidth: 400, minHeight: 80 }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 0" }}>
            <button className="forum-btn" onClick={saveConfig}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div>
          <div className="category-header">Manage Categories</div>

          {categories.length > 0 && (
            <table className="forum-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Threads</th>
                  <th>Posts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ textAlign: "center" }}>{cat.sort_order}</td>
                    <td style={{ fontWeight: "bold" }}>{cat.name}</td>
                    <td>{cat.description}</td>
                    <td style={{ textAlign: "center" }}>{cat.thread_count}</td>
                    <td style={{ textAlign: "center" }}>{cat.post_count}</td>
                    <td>
                      <button
                        className="forum-btn forum-btn-red"
                        style={{ fontSize: 10, padding: "3px 8px" }}
                        onClick={() => deleteCategory(cat.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="category-header" style={{ fontSize: 12 }}>
            Add New Category
          </div>
          <table className="forum-table">
            <tbody>
              <tr>
                <td style={{ width: "25%", fontWeight: "bold", fontSize: 11 }}>Name</td>
                <td>
                  <input
                    className="forum-input"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    style={{ maxWidth: 300 }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", fontSize: 11 }}>Description</td>
                <td>
                  <input
                    className="forum-input"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short description"
                    style={{ maxWidth: 400 }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", fontSize: 11 }}>Sort Order</td>
                <td>
                  <input
                    type="number"
                    className="forum-input"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(Number(e.target.value))}
                    style={{ maxWidth: 80 }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 0" }}>
            <button className="forum-btn" onClick={createCategory}>
              Create Category
            </button>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <div className="category-header">User Management</div>
          <table className="forum-table">
            <tbody>
              <tr>
                <td style={{ width: "25%", fontWeight: "bold", fontSize: 11 }}>
                  Make Admin
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className="forum-input"
                      value={makeAdminUsername}
                      onChange={(e) => setMakeAdminUsername(e.target.value)}
                      placeholder="Enter username"
                      style={{ maxWidth: 200 }}
                    />
                    <button className="forum-btn" onClick={makeAdmin}>
                      Make Admin
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
