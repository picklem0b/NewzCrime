/**
 * The embedded YouTube player.
 *
 * YouTube's terms do not allow audio-only or background playback, so a video
 * plays inside this WebView while the reader is on the screen. Leaving the
 * screen pauses it with the page. The "Watch on YouTube" button remains for
 * full screen, captions and saving to a YouTube account.
 */

import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer, { PLAYER_STATES } from 'react-native-youtube-iframe';

import { useTheme } from '@/hooks/useTheme';

export interface YouTubePlayerProps {
  videoId: string;
  height: number;
  width: number;
  /** Start with the player muted; used by the playback setting. */
  muted?: boolean;
  /** Ask YouTube for closed captions when the video has them. */
  captions?: boolean;
  /** Fired when a video reaches its end, for autoplay-next. */
  onEnded?: () => void;
}

export function YouTubePlayer({
  videoId,
  height,
  width,
  muted = false,
  captions = false,
  onEnded
}: YouTubePlayerProps): ReactElement {
  const { colour } = useTheme();

  return (
    <View
      style={[
        styles.frame,
        {
          height,
          width,
          backgroundColor: '#000',
          borderColor: colour.border
        }
      ]}
    >
      <YoutubePlayer
        height={height}
        width={width}
        videoId={videoId}
        mute={muted}
        onChangeState={(state) => {
          if (state === PLAYER_STATES.ENDED) onEnded?.();
        }}
        initialPlayerParams={{
          controls: true,
          rel: false,
          preventFullScreen: false,
          showClosedCaptions: captions
        }}
        webViewProps={{
          allowsFullscreenVideo: true,
          allowsInlineMediaPlayback: true
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth
  }
});

export default YouTubePlayer;
