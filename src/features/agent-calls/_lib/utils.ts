export function getAgentKeyFromCookie() {
  if (typeof document === "undefined") {
    return "mariz";
  }

  const match = document.cookie.match(/agent_name=([^;]+)/);
  const agentName = match ? decodeURIComponent(match[1]) : "Mariz";
  return agentName.split(" ")[0].toLowerCase();
}
