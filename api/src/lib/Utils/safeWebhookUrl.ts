import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

// Addresses a webhook must never reach: loopback, private networks, link-local
// (including cloud metadata at 169.254.169.254), carrier-grade NAT and other reserved ranges.
const blocked = new BlockList();
[
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 4],
	['240.0.0.0', 4],
].forEach(([net, prefix]) => blocked.addSubnet(net as string, prefix as number, 'ipv4'));
[
	['::', 128],
	['::1', 128],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8],
].forEach(([net, prefix]) => blocked.addSubnet(net as string, prefix as number, 'ipv6'));

function isBlockedAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return blocked.check(address, 'ipv4');
	if (family === 6) {
		// IPv4-mapped IPv6 (::ffff:10.0.0.1) is checked as IPv4
		const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
		if (mapped) return blocked.check(mapped[1], 'ipv4');
		return blocked.check(address, 'ipv6');
	}
	return true;
}

/**
 * Throws if a webhook URL is not http(s) or resolves to an internal address.
 * Self-hosted installs that deliberately send webhooks to internal services can
 * set WEBHOOK_ALLOW_PRIVATE_NETWORKS=true to skip the address check.
 */
export async function assertSafeWebhookUrl(raw_url: string): Promise<URL> {
	let url: URL;
	try {
		url = new URL(raw_url);
	} catch {
		throw Object.assign(new Error('Invalid webhook URL'), { statusCode: 400 });
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') {
		throw Object.assign(new Error('Webhook URLs must use http or https'), { statusCode: 400 });
	}
	if (url.username || url.password) {
		throw Object.assign(new Error('Webhook URLs cannot contain credentials; use headers instead'), {
			statusCode: 400,
		});
	}
	if (process.env.WEBHOOK_ALLOW_PRIVATE_NETWORKS === 'true') {
		return url;
	}

	const host = url.hostname.replace(/^\[|\]$/g, '');
	const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
	if (addresses.length === 0 || addresses.some(isBlockedAddress)) {
		throw Object.assign(new Error('Webhook URLs cannot point to internal or private network addresses'), {
			statusCode: 400,
		});
	}
	return url;
}
