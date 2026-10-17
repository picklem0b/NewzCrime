/** Outbound actions.

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

/** Share an item's title and link through the system share sheet.

 * Includes the deep-link scheme in the message so the recipient can copy-paste
 * it to open the item directly in the app (newzcrime://detail/ItemDetail?itemId=...).
 */
export async function shareItem(item: ContentItem): Promise<void> {
  const excerpt = item.excerpt ? `\n\n${item.excerpt}` : '';

  const deepLink = item.url
    ? `newzcrime://detail/ItemDetail?itemId=${item.id}`
    : null;

  const shareMessage = item.title + excerpt + `\n\n${item.url}`;
  const shareData = {
    title: item.title,
    message: shareMessage,
    url: item.url,
  };

  // Append the deep link to the message so the recipient can open the item
  // in the app. On Android, the deep link can be used with an intent filter;
  // on iOS, the user can copy-paste it.
  if (deepLink) {
    shareData.message += `\n\nDeep link: ${deepLink}`;
  }

  await Share.share(shareData);
}
