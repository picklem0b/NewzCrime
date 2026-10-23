/**
 * Outbound actions.
 *
 * The app never reproduces a publisher's article, so opening the source and
 * sharing the link are the two ways a reader leaves with the story. Which
 * surface opens a link follows the General setting: the in-app browser keeps
 * the reader one tap from the feed, the system browser hands the page to the
 * browser they already have open.
 */

import type { ContentItem } from '@newzcrime/shared';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Share } from 'react-native';

import { readSettings } from '@/stores/settings.store';

/** Open a publisher page, in the in-app browser or the system one. */
export async function openExternalUrl(url: string): Promise<void> {
	if (!url) return;

	if (!readSettings().openLinksInApp) {
		await Linking.openURL(url);
		return;
	}

	await WebBrowser.openBrowserAsync(url, {
		enableBarCollapsing: true,
		showTitle: true
	});
}

/** Share an item's title and link through the system share sheet. */
export async function shareItem(item: ContentItem): Promise<void> {
	const excerpt = item.excerpt ? `\n\n${item.excerpt}` : '';
	const deepLink = `newzcrime://detail/ItemDetail?itemId=${item.id}`;
	const message = `${item.title}${excerpt}\n\n${item.url}\n\nDeep link: ${deepLink}`;

	await Share.share({
		title: item.title,
		message,
		url: item.url
	});
}
