/** JSON som kan ligga i <script type="application/json"> utan att '</script>' i data avslutar taggen. */
export function jsonForScript(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}
