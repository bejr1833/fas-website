# FAS free BIMI asset and rollout notes

## Published logo asset

The FAS BIMI vector draft is served by the existing static frontend at:

- https://fas-fellowship.org/branding/bimi-logo.svg

The file is a square, self-contained SVG Tiny PS draft with a solid white background, a title and description, and vector paths only. It is not a certified mark and has not been independently accepted by every BIMI validator. Validate it before publishing the DNS record.

## Current DNS posture

The domain currently has a DMARC monitoring record:

```txt
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
```

Do not publish a BIMI DNS record while DMARC remains at `p=none`. BIMI requires an enforced DMARC policy (`p=quarantine` or `p=reject`) with full policy coverage. Before changing policy, review DMARC aggregate reports and confirm every legitimate sender is aligned. Brevo is currently the only known sender, and its test message passed aligned DKIM and DMARC.

## Free/self-asserted BIMI record (for providers that accept it)

After the SVG is validated and DMARC enforcement has been safely enabled, the self-asserted BIMI TXT record can be:

```txt
Host: default._bimi
Value: v=BIMI1; l=https://fas-fellowship.org/branding/bimi-logo.svg; a=
```

This is a certificate-free BIMI record. It does **not** satisfy Gmail's certificate requirement, so it must not be represented as a way to make Gmail display the logo. Some other participating mailbox providers may display self-asserted BIMI, subject to their own policy.

## Important limitations

- Gmail requires a qualifying VMC or CMC certificate for BIMI logo display.
- A self-asserted BIMI record and SVG are free, but do not guarantee display in any mailbox.
- Do not change SPF, DKIM, MX, A, or CNAME records as part of this rollout.
- Do not change DMARC from `p=none` until aggregate reports have been reviewed and the domain's legitimate sending behavior is understood.
- The public SVG path is an asset on the existing Render static site; it does not require a new service or paid hosting.

## Verification after deployment

1. Confirm the SVG returns HTTP 200 at the URL above.
2. Confirm its response content type is `image/svg+xml`.
3. Validate SVG Tiny PS compliance with a BIMI/SVG PS validator.
4. Review DMARC aggregate reports.
5. Only then plan the DMARC enforcement change and publish the BIMI TXT record.
