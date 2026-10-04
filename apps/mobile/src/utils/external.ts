/**
 * Outbound actions.
 *
 * The app never reproduces a publisher's article, so opening the source and
 * sharing the link are the two ways a reader leaves with the story.
 */

import type { ContentItem } from '@newzcrime/shared';
import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';

/** Open a publisher page in the in-app browser. */
export async function openExternalUrl(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url);
}

/** Share an item's title and link through the system share sheet. */
export async function shareItem(item: ContentItem): Promise<void> {
  const excerpt = item.excerpt ? `\n\n${item.excerpt}` : '';

  await Share.share({
    title: item.title,
    message: `${item.title}${excerpt}\n\n${item.url}`,
    // iOS honours `url`; Android uses the message.
    url: item.url,
  });
}
