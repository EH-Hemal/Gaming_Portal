# PlayNova costs

The complete local version costs **$0 in software and service fees**. It runs on your existing computer. There are no API keys, paid assets, hosted databases, accounts, advertising SDKs or subscriptions required. Electricity and internet access are outside that statement.

## Free technologies and licences

| Technology | Licence / cost |
| --- | --- |
| React, React DOM, React Router | MIT; free |
| Vite and its React plugin | MIT; free |
| Tailwind CSS and Vite integration | MIT; free |
| Express, Helmet, express-rate-limit | MIT; free |
| Lucide React icons | ISC; free |
| dotenv | BSD-2-Clause; free |
| Node.js | Open-source runtime, principally MIT with bundled component notices |
| SQLite | Public domain; no database server fee |
| Built-in games and SVG artwork | Original project implementations; no third-party game licensing fee |

Retain dependency licences when distributing. Complete transitive notices are provided by the packages in `node_modules`; the lockfile fixes the dependency versions used for this build. Classic mechanics are implemented with original code and artwork; this is not a redistribution of another developer’s game.

## Optional public operation

These are planning allowances, not quotes. Verify current pricing, taxes, bandwidth, renewal rates and regional billing before purchasing.

- **Domain:** allow roughly US$10–25/year for an ordinary non-premium domain. Registration promotions may differ from renewal pricing. See the [registrar’s current price table](https://porkbun.com/products/domains/tld_pricing).
- **Hosting and storage:** allow roughly US$5–12/month for a small Linux server with a persistent filesystem. A single low-traffic Node process can serve both the built React app and SQLite API. Confirm memory, disk, traffic and backup allowances. The production build may be built on your local machine if server memory is limited.
- **Backups:** budget separately for off-server backups or snapshots. Provider disk persistence does not protect against accidental deletion or a failed server. Costs depend on retained data and frequency.
- **Managed hosting:** usually adds a paid service plus persistent disk charges. [Render documents persistent disks on paid services](https://render.com/docs/disks). Its [free services use ephemeral storage and cannot attach persistent disks](https://render.com/docs/free). Free ephemeral hosting does **not** provide permanent SQLite storage; edits, admin accounts and contact messages can disappear after a restart/redeploy.
- **HTTPS:** automated certificates can be obtained free; configuration and maintenance still take time.

## Game licensing

The included games have no third-party game fees. Future games may be free under a permissive licence, require attribution, charge a licence fee, restrict distribution, or share revenue. Hosting files and iframe permission are separate rights. Obtain and retain written permission or the applicable licence before adding games. An external-play link is a fallback, not permission to embed or copy assets.

## Future advertising and membership

Ad slots are placeholders. Connecting an ad network may require approval, traffic levels, consent/privacy work, performance testing and revenue-sharing terms. There is no guaranteed income. No network integration is implemented.

Membership is labelled Coming Soon. Payments would add transaction/provider fees, tax handling, refunds, account management, subscription cancellation and secure webhook implementation. None of those costs or features are incurred by this local version.

## Affordable practical approach

For the exam, run locally at no service cost. For a small public launch, use one modest server with persistent storage, an optional domain, HTTPS, and independent backups. This keeps React, Express and SQLite together without a separate paid database. Budget approximately US$70–170/year before tax and optional backups using the allowances above. A provider’s free subdomain can remove the domain cost where supported. Scale only after measuring traffic; SQLite in this implementation is intended for one app instance.
