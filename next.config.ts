import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't auto-generate AGENTS.md/CLAUDE.md into the repo on every build.
  agentRules: false,
  images: {
    // Car photos are same-origin (/img/**), so there are no remote patterns.
    // The optimizer keeps a transformed copy for at least this long, which is
    // also how long a car that went non-visible can still be served from it,
    // so it matches the /img s-maxage rather than the 4h default.
    minimumCacheTTL: 900,
  },
}

export default nextConfig
