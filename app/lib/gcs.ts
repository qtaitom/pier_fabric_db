import crypto from "crypto";

const BUCKET = "pier-fabric-pdfs";
const SCOPES = "https://www.googleapis.com/auth/devstorage.read_write";

function createJwt(email: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: email,
    scope: SCOPES,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  return `${header}.${payload}.${sign.sign(privateKey, "base64url")}`;
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const jwt = createJwt(email, privateKey);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Auth hiba: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function uploadToGcs(buffer: Buffer | Uint8Array, fileName: string): Promise<string> {
  const token = await getAccessToken();
  const objectName = `${Date.now()}_${fileName.replace(/\s+/g, "_")}`;

  const res = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(objectName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
      },
      body: buffer as BodyInit,
    }
  );

  if (!res.ok) throw new Error(`GCS feltöltési hiba: ${await res.text()}`);
  return objectName;
}

export async function downloadFromGcs(objectName: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encodeURIComponent(objectName)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`GCS letöltési hiba: ${res.status}`);
  return { data: await res.arrayBuffer(), contentType: "application/pdf" };
}
