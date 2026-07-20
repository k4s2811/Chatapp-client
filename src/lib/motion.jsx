import { LazyMotion } from 'framer-motion';

/**
 * Async-loaded framer-motion feature bundle.
 *
 * Importing `motion` pulls framer's entire feature set into whatever chunk
 * references it — that's ~150 KB (≈50 KB gzip) sitting in the critical
 * post-login chunk purely for tap effects and a few menu transitions.
 *
 * Instead every component imports the lightweight `m` primitive and this
 * provider fetches the features in a separate chunk after mount. Animations are
 * inert for the few hundred ms before it resolves — which is exactly the window
 * where we'd rather spend bandwidth on the chat itself.
 *
 * `domMax` (not the smaller `domAnimation`) is required: NavigationRail and the
 * auth tab bar use shared-layout animations via `layoutId`.
 */
const loadFeatures = () => import('framer-motion').then((mod) => mod.domMax);

export default function MotionProvider({ children }) {
    return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
