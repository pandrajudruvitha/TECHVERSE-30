"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AlertCircle, LogOut, Plus, Server, Trash2 } from "lucide-react";

type AssetStatus = "active" | "maintenance" | "retired";
type AuthMode = "login" | "register";

type Asset = {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  assigned_to: string | null;
  location: string | null;
  status: AssetStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AssetDraft = {
  name: string;
  asset_tag: string;
  category: string;
  assigned_to: string;
  location: string;
  status: AssetStatus;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const emptyDraft: AssetDraft = {
  name: "",
  asset_tag: "",
  category: "Laptop",
  assigned_to: "",
  location: "",
  status: "active",
};

function isAsset(value: unknown): value is Asset {
  if (!value || typeof value !== "object") return false;
  const asset = value as Record<string, unknown>;
  return (
    typeof asset.id === "number" &&
    typeof asset.name === "string" &&
    typeof asset.asset_tag === "string" &&
    typeof asset.category === "string" &&
    (asset.assigned_to === null || typeof asset.assigned_to === "string") &&
    (asset.location === null || typeof asset.location === "string") &&
    (asset.status === "active" ||
      asset.status === "maintenance" ||
      asset.status === "retired") &&
    (asset.notes === null || typeof asset.notes === "string") &&
    typeof asset.created_at === "string" &&
    typeof asset.updated_at === "string"
  );
}

async function responseError(response: Response): Promise<string> {
  const result: unknown = await response.json().catch(() => null);
  if (
    result &&
    typeof result === "object" &&
    "detail" in result &&
    typeof result.detail === "string"
  ) {
    return result.detail;
  }
  return `Request failed with status ${response.status}.`;
}

function isAccessToken(value: unknown): value is { access_token: string } {
  return (
    !!value &&
    typeof value === "object" &&
    "access_token" in value &&
    typeof value.access_token === "string"
  );
}

export default function AssetInventory() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [draft, setDraft] = useState<AssetDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetSaving, setAssetSaving] = useState(false);
  const [updatingAssetId, setUpdatingAssetId] = useState<number | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);

  const fetchAssets = useCallback(async (token: string): Promise<Asset[]> => {
    const response = await fetch(`${apiBaseUrl}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await responseError(response));

    const result: unknown = await response.json();
    if (!Array.isArray(result) || !result.every(isAsset)) {
      throw new Error("The API returned an invalid asset inventory response.");
    }
    return result;
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;
    void fetchAssets(accessToken)
      .then((result) => {
        if (active) setAssets(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Could not load the inventory.",
          );
        }
      })
      .finally(() => {
        if (active) setAssetsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, fetchAssets]);

  const totals = useMemo(
    () => ({
      all: assets.length,
      active: assets.filter((asset) => asset.status === "active").length,
      attention: assets.filter((asset) => asset.status === "maintenance").length,
    }),
    [assets],
  );

  const handleAuthentication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthPending(true);
    setError("");
    setNotice("");

    try {
      if (authMode === "register") {
        const registration = await fetch(`${apiBaseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!registration.ok) {
          throw new Error(await responseError(registration));
        }
      }

      const login = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) throw new Error(await responseError(login));

      const result: unknown = await login.json();
      if (!isAccessToken(result)) {
        throw new Error("The API did not return a valid access token.");
      }

      setEmail(email.trim().toLowerCase());
      setPassword("");
      setAssetsLoading(true);
      setAccessToken(result.access_token);
      setNotice(
        authMode === "register"
          ? "Account created. Your private inventory is ready."
          : "Signed in. Your private inventory is ready.",
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Authentication failed.",
      );
    } finally {
      setAuthPending(false);
    }
  };

  const createAsset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;

    setAssetSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBaseUrl}/assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draft,
          assigned_to: draft.assigned_to || null,
          location: draft.location || null,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const created: unknown = await response.json();
      if (!isAsset(created)) {
        throw new Error("The API returned an invalid asset record.");
      }
      setAssets((current) => [created, ...current]);
      setDraft(emptyDraft);
      setNotice(`${created.asset_tag} was added to your inventory.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not save the asset.");
    } finally {
      setAssetSaving(false);
    }
  };

  const updateAssetStatus = async (asset: Asset, status: AssetStatus) => {
    if (!accessToken) return;

    setUpdatingAssetId(asset.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBaseUrl}/assets/${asset.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const updated: unknown = await response.json();
      if (!isAsset(updated)) {
        throw new Error("The API returned an invalid asset record.");
      }
      setAssets((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`${updated.asset_tag} status updated.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not update the asset.");
    } finally {
      setUpdatingAssetId(null);
    }
  };

  const deleteAsset = async (asset: Asset) => {
    if (!accessToken || !window.confirm(`Delete ${asset.asset_tag} from your inventory?`)) {
      return;
    }

    setDeletingAssetId(asset.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBaseUrl}/assets/${asset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(await responseError(response));

      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setNotice(`${asset.asset_tag} was deleted.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not delete the asset.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  return (
    <section className="asset-workspace" aria-labelledby="asset-workspace-title">
      <div className="asset-workspace-heading">
        <div>
          <span className="panel-eyebrow">STAGE 04 · IT MANAGEMENT</span>
          <h3 id="asset-workspace-title">IT asset inventory</h3>
          <p>Track equipment, ownership, locations, and service status.</p>
        </div>
        {accessToken && (
          <button
            className="asset-logout-button"
            onClick={() => {
              setAccessToken(null);
              setAssets([]);
              setAssetsLoading(false);
              setError("");
              setNotice("");
            }}
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        )}
      </div>

      {error && (
        <p className="asset-feedback asset-feedback-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}
      {notice && (
        <p className="asset-feedback asset-feedback-success" role="status">
          {notice}
        </p>
      )}

      {!accessToken ? (
        <form className="asset-auth-form" onSubmit={handleAuthentication}>
          <div className="asset-auth-copy">
            <span className="asset-auth-icon">
              <Server size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>
                {authMode === "login"
                  ? "Sign in to your workspace"
                  : "Create your workspace account"}
              </strong>
              <p>
                Inventory is private to your account. Your access token stays in
                this browser session.
              </p>
            </div>
          </div>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
              type="password"
              required
              minLength={authMode === "register" ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className="asset-auth-actions">
            <button className="asset-primary-button" disabled={authPending}>
              {authPending
                ? "Please wait…"
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
            <button
              className="asset-text-button"
              type="button"
              onClick={() => {
                setAuthMode((current) =>
                  current === "login" ? "register" : "login",
                );
                setError("");
                setNotice("");
              }}
            >
              {authMode === "login"
                ? "Need an account? Register"
                : "Already registered? Sign in"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="asset-stat-row" aria-label="Inventory summary">
            <div>
              <span>Total assets</span>
              <strong>{totals.all}</strong>
            </div>
            <div>
              <span>In service</span>
              <strong>{totals.active}</strong>
            </div>
            <div>
              <span>Needs attention</span>
              <strong>{totals.attention}</strong>
            </div>
          </div>

          <form className="asset-create-form" onSubmit={createAsset}>
            <div className="asset-form-heading">
              <strong>Add an asset</strong>
              <span>Asset tags must be unique in your inventory.</span>
            </div>
            <div className="asset-fields">
              <label>
                Asset tag
                <input
                  required
                  maxLength={64}
                  placeholder="e.g. LT-1042"
                  value={draft.asset_tag}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      asset_tag: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Asset name
                <input
                  required
                  maxLength={160}
                  placeholder="e.g. Engineering laptop"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Category
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  {["Laptop", "Desktop", "Network", "Mobile", "Other"].map(
                    (category) => (
                      <option key={category}>{category}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Assigned to
                <input
                  maxLength={160}
                  placeholder="Person or team"
                  value={draft.assigned_to}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      assigned_to: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  maxLength={160}
                  placeholder="Office or site"
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Service status
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as AssetStatus,
                    }))
                  }
                >
                  <option value="active">In service</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
            </div>
            <button className="asset-primary-button" disabled={assetSaving}>
              <Plus size={14} aria-hidden="true" />
              {assetSaving ? "Adding…" : "Add asset"}
            </button>
          </form>

          <div className="asset-table-wrap">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Assigned to</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {assetsLoading ? (
                  <tr>
                    <td colSpan={6} className="asset-table-empty">
                      Loading your assets…
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="asset-table-empty">
                      No assets yet. Add your first IT asset above.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <strong>{asset.name}</strong>
                        <small>{asset.asset_tag}</small>
                      </td>
                      <td>{asset.category}</td>
                      <td>{asset.assigned_to || "Unassigned"}</td>
                      <td>{asset.location || "—"}</td>
                      <td>
                        <select
                          aria-label={`Status for ${asset.asset_tag}`}
                          className={`asset-status-select asset-status-${asset.status}`}
                          disabled={updatingAssetId === asset.id}
                          value={asset.status}
                          onChange={(event) =>
                            void updateAssetStatus(
                              asset,
                              event.target.value as AssetStatus,
                            )
                          }
                        >
                          <option value="active">In service</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="retired">Retired</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="asset-delete-button"
                          aria-label={`Delete ${asset.asset_tag}`}
                          disabled={deletingAssetId === asset.id}
                          onClick={() => void deleteAsset(asset)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
