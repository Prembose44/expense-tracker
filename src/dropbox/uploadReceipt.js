import { Dropbox } from "dropbox";


function getDropboxClient() {
  return new Dropbox({
    clientId:     import.meta.env.VITE_DROPBOX_APP_KEY,
    refreshToken: import.meta.env.VITE_DROPBOX_REFRESH_TOKEN,
  });
}


export async function uploadReceipt(file, userId) {
  const dbx = getDropboxClient();

  // Build a unique file path so uploads never overwrite each other
  const timestamp = Date.now();
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path      = `/ExpenseVault/receipts/${userId}/${timestamp}_${safeName}`;

  // Convert File → ArrayBuffer for the Dropbox SDK
  const arrayBuffer = await file.arrayBuffer();

  // Upload the file (overwrite: false keeps history safe)
  const uploadRes = await dbx.filesUpload({
    path,
    contents: arrayBuffer,
    mode:     { ".tag": "add" },
    autorename: true, // auto-rename if file already exists
  });

  // Create a shared link so the image can be displayed in the browser
  let shareRes;
  try {
    shareRes = await dbx.sharingCreateSharedLinkWithSettings({
      path: uploadRes.result.path_display,
    });
  } catch (err) {
    // If a shared link already exists, fetch and reuse it
    if (err?.error?.error?.[".tag"] === "shared_link_already_exists") {
      const existing = await dbx.sharingListSharedLinks({
        path: uploadRes.result.path_display,
        direct_only: true,
      });
      shareRes = { result: existing.result.links[0] };
    } else {
      throw err;
    }
  }


  const previewUrl = shareRes.result.url;
  const directUrl  = previewUrl
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "")
    .replace("&dl=0", "");

  return {
    url:  directUrl,
    path: uploadRes.result.path_display,
    name: file.name,
  };
}


export async function deleteReceipt(path) {
  if (!path) return;
  const dbx = getDropboxClient();
  try {
    await dbx.filesDeleteV2({ path });
  } catch (err) {
    // Don't block the expense delete if Dropbox delete fails
    console.warn("Could not delete receipt from Dropbox:", err);
  }
}
