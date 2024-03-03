export async function getWebFirebaseAuth() {
  return await import("firebase/auth");
}

export async function getExtensionFirebaseAuth() {
  return await import("firebase/auth/web-extension");
}
