export async function sendTeamsMessage(message: string, webhookUrl: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Teams webhook failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }
}
