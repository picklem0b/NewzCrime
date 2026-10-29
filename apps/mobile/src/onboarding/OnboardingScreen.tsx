import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { ArrowRightIcon, SparkleIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	useWindowDimensions,
	View
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/ui/Text';
import { brand, onboardingTheme } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import { markOnboardingSeen } from '@/services/onboarding';
import { preloadAppContent } from '@/services/preload';
import { useSettingsStore } from '@/stores/settings.store';
import { tapFeedback } from '@/utils/haptics';

import OnboardingArt from './OnboardingArt';
import { onboardingSlides } from './slides';
import type { OnboardingSlide } from './slides';

const {
	gradient: GRADIENT,
	ink: INK,
	paper: PAPER,
	scrim: SCRIM,
	clear: CLEAR,
	root: ROOT,
	shade: SHADE,
	wash: WASH,
	swirlWarm: SWIRL_WARM,
	swirlDeep: SWIRL_DEEP,
	swirlLight: SWIRL_LIGHT,
	glass: GLASS,
	glassBorder: GLASS_BORDER,
	dotIdle: DOT_IDLE,
	shadow: SHADOW,
	captionShadow: CAPTION_SHADOW
} = onboardingTheme;

/** Long enough for a warm preload, short enough that Skip still feels instant. */
const FINISH_WAIT_MS = 2200;

const wait = (milliseconds: number): Promise<void> =>
	new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});

/**
 * First-run introduction.
 *
 * Shown once, before the tabs, and used as the app's warm-up window: the feed
 * and the source directory are fetched while the reader is looking at the four
 * cards, so Today opens on stories instead of a skeleton. The artwork is the
 * supplied illustration set on a cream disc, because the SVGs have no
 * background of their own and would disappear into the gradient.
 */
export default function OnboardingScreen(): ReactElement {
	const router = useRouter();
	const { scheme } = useTheme();
	const { gutter } = useLayout();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const startTab = useSettingsStore(state => state.saved.startTab);
	const defaultTopic = useSettingsStore(state => state.saved.defaultTopic);
	const listRef = useRef<FlatList<OnboardingSlide>>(null);
	const finishingRef = useRef(false);
	const [index, setIndex] = useState(0);
	const [finishing, setFinishing] = useState(false);

	const availableHeight = height - insets.top - insets.bottom;
	/** Header (52) and footer (dots, action and its status line) in dp. */
	const pageHeight = Math.max(280, availableHeight - 168);
	const artSize = Math.round(
		Math.min(
			330,
			Math.max(176, Math.min(width - 84, pageHeight - 238))
		)
	);

	const isLast = index === onboardingSlides.length - 1;

	const target =
		startTab === 'search'
			? '/search/Search'
			: startTab === 'saved'
				? '/tabs/Saved'
				: '/tabs/Home';

	// The app is status-bar dark in light mode; this screen is always dark.
	useEffect(() => {
		setStatusBarStyle('light');
		return () => setStatusBarStyle(scheme === 'dark' ? 'light' : 'dark');
	}, [scheme]);

	// Start fetching immediately. By the time the last card is read, the cache
	// that Today reads is normally already warm.
	useEffect(() => {
		void preloadAppContent(defaultTopic);
		// The topic is read once at mount: changing it later is a Settings action
		// and does not need to restart a preload.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		listRef.current?.scrollToOffset({
			offset: index * width,
			animated: false
		});
		// Only a rotation changes the page width; `index` is read, not watched.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [width]);

	const finish = async (): Promise<void> => {
		if (finishingRef.current) return;
		finishingRef.current = true;
		tapFeedback();
		setFinishing(true);

		await markOnboardingSeen();
		await Promise.race([
			preloadAppContent(defaultTopic),
			wait(FINISH_WAIT_MS)
		]);

		router.replace(target);
	};

	const next = (): void => {
		if (isLast) {
			void finish();
			return;
		}

		tapFeedback();
		const targetIndex = index + 1;
		setIndex(targetIndex);
		listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
	};

	const onMomentumEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>
	): void => {
		const page = Math.round(event.nativeEvent.contentOffset.x / width);
		const bounded = Math.max(0, Math.min(onboardingSlides.length - 1, page));
		setIndex(bounded);
	};

	return (
		<View style={styles.root}>
			<LinearGradient
				colors={GRADIENT}
				start={{ x: 0.04, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<LinearGradient
				colors={[WASH, CLEAR, SHADE]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
				pointerEvents='none'
			/>

			{/* Two oversized circles, one warm and one deep, soften the linear
			    wash into something closer to a swirl without a shader. */}
			<View
				pointerEvents='none'
				style={[
					styles.swirl,
					{
						width: width * 1.16,
						height: width * 1.16,
						borderRadius: width * 0.58,
						top: -width * 0.52,
						right: -width * 0.36,
						backgroundColor: SWIRL_WARM
					}
				]}
			/>
			<View
				pointerEvents='none'
				style={[
					styles.swirl,
					{
						width: width * 0.96,
						height: width * 0.96,
						borderRadius: width * 0.48,
						bottom: -width * 0.34,
						left: -width * 0.28,
						backgroundColor: SWIRL_DEEP
					}
				]}
			/>
			<View
				pointerEvents='none'
				style={[
					styles.swirl,
					{
						width: width * 0.42,
						height: width * 0.42,
						borderRadius: width * 0.21,
						top: height * 0.16,
						left: -width * 0.18,
						backgroundColor: SWIRL_LIGHT
					}
				]}
			/>

			<LinearGradient
				colors={[CLEAR, SCRIM]}
				style={[styles.scrim, { height: height * 0.56 }]}
				pointerEvents='none'
			/>

			<SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
				<View
					style={[
						styles.header,
						{ paddingHorizontal: gutter + 4 }
					]}
				>
					<Text variant='masthead' style={{ color: PAPER }}>
						{brand.name}
					</Text>

					{!finishing ? (
						<Pressable
							accessibilityRole='button'
							accessibilityLabel='Skip introduction'
							onPress={() => void finish()}
							hitSlop={12}
							style={({ pressed }) => [
								styles.skip,
								{ backgroundColor: GLASS, borderColor: GLASS_BORDER, opacity: pressed ? 0.7 : 1 }
							]}
						>
							<Text variant='label' style={{ color: PAPER }}>
								Skip
							</Text>
						</Pressable>
					) : null}
				</View>

				<FlatList
					ref={listRef}
					data={onboardingSlides}
					keyExtractor={slide => slide.id}
					horizontal
					pagingEnabled
					bounces={false}
					showsHorizontalScrollIndicator={false}
					style={styles.fill}
					getItemLayout={(_data, itemIndex) => ({
						length: width,
						offset: width * itemIndex,
						index: itemIndex
					})}
					onMomentumScrollEnd={onMomentumEnd}
					renderItem={({ item }) => (
						<View
							style={[
								styles.page,
								{
									width,
									height: pageHeight,
									paddingHorizontal: gutter
								}
							]}
						>
							<OnboardingArt slide={item} size={artSize} />

							<Text
								variant='h1'
								accessibilityRole='header'
								numberOfLines={3}
								style={[
									styles.caption,
									{
										color: PAPER,
										maxWidth: Math.min(width - gutter * 2 - 16, 420)
									}
								]}
							>
								{item.caption}
							</Text>
						</View>
					)}
				/>

				<View
					style={[
						styles.footer,
						{
							paddingHorizontal: gutter + 4,
							paddingBottom: 8
						}
					]}
				>
					<View
						accessible={false}
						style={styles.dots}
					>
						{onboardingSlides.map((slide, dotIndex) => (
							<View
								key={slide.id}
								style={[
									styles.dot,
									{
										width: dotIndex === index ? 22 : 7,
									backgroundColor:
										dotIndex === index ? PAPER : DOT_IDLE
									}
								]}
							/>
						))}
					</View>

					<Pressable
						accessibilityRole='button'
						accessibilityLabel={isLast ? 'Start reading' : 'Next'}
						accessibilityState={{ busy: finishing, disabled: finishing }}
						disabled={finishing}
						onPress={next}
						style={({ pressed }) => [
							styles.cta,
							{
								opacity: finishing ? 0.78 : pressed ? 0.9 : 1,
								transform: [{ scale: pressed ? 0.988 : 1 }]
							}
						]}
					>
						{finishing ? (
							<ActivityIndicator color={INK} />
						) : (
							<View style={styles.ctaContent}>
								<Text variant='button' style={{ color: INK }}>
									{isLast ? 'Get started' : 'Next'}
								</Text>
								{isLast ? (
									<SparkleIcon size={18} color={INK} weight='fill' />
								) : (
									<ArrowRightIcon size={18} color={INK} weight='bold' />
								)}
							</View>
						)}
					</Pressable>

					<View style={styles.preparingRow}>
						{finishing ? (
							<Text variant='meta' style={{ color: PAPER }}>
								Preparing your feed…
							</Text>
						) : null}
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, overflow: 'hidden', backgroundColor: ROOT },
	fill: { flex: 1 },
	swirl: { position: 'absolute' },
	scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
	header: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	skip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth
	},
	page: { alignItems: 'center', justifyContent: 'center' },
	caption: {
		textAlign: 'center',
		marginTop: 18,
		textShadowColor: CAPTION_SHADOW,
		textShadowRadius: 14,
		textShadowOffset: { width: 0, height: 1 }
	},
	footer: { gap: 14 },
	dots: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		minHeight: 8
	},
	dot: { height: 7, borderRadius: 999 },
	cta: {
		minHeight: 54,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: PAPER,
		shadowColor: SHADOW,
		shadowOpacity: 0.22,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8
	},
	ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	preparingRow: { minHeight: 18, alignItems: 'center', justifyContent: 'center' }
});
