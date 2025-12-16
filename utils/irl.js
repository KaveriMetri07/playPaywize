export function generateIRL() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Random string to prevent duplicates
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  // FIX: Added correct template literal with backticks
  return `PW${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}
