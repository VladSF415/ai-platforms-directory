import json
import urllib.request
import urllib.error
import socket
import ssl
import time
from urllib.parse import urlparse

def check_url(url, timeout=10):
    """
    Check if a URL exists and is reachable.
    Returns: (status, message)
    - status: 'valid', 'invalid', 'error', 'redirect'
    - message: description of the result
    """
    if not url:
        return 'invalid', 'No URL provided'

    # Ensure URL has a scheme
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        # Create a request with a user agent to avoid blocks
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        req = urllib.request.Request(url, headers=headers)

        # Create SSL context that doesn't verify certificates (some sites have issues)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            status_code = response.getcode()
            final_url = response.geturl()
            content_type = response.headers.get('Content-Type', '')

            # Check if redirected to a different domain
            original_domain = urlparse(url).netloc
            final_domain = urlparse(final_url).netloc

            # Check for parked domain indicators
            parked_indicators = [
                'domain is for sale',
                'this domain may be for sale',
                'parked domain',
                'coming soon',
                'under construction',
                'domain not configured',
                'this site can\'t be reached',
                'godaddy',
                'namecheap',
                'sedo'
            ]

            # Read some content to check for parked domain
            content = response.read(10000).decode('utf-8', errors='ignore').lower()

            is_parked = any(indicator in content for indicator in parked_indicators)

            if is_parked:
                return 'invalid', f'Parked domain or for sale (Status: {status_code})'

            if original_domain != final_domain and not final_domain.endswith(original_domain):
                return 'redirect', f'Redirects to different domain: {final_domain} (Status: {status_code})'

            return 'valid', f'Active (Status: {status_code})'

    except urllib.error.HTTPError as e:
        if e.code in [403, 401]:
            # Forbidden/Unauthorized might mean the site exists but blocks bots
            return 'valid', f'Site exists but access restricted (Status: {e.code})'
        elif e.code == 404:
            return 'invalid', f'Page not found (404)'
        elif e.code >= 500:
            return 'error', f'Server error (Status: {e.code})'
        else:
            return 'error', f'HTTP Error {e.code}'

    except urllib.error.URLError as e:
        if isinstance(e.reason, socket.gaierror):
            return 'invalid', 'Domain does not exist (DNS resolution failed)'
        elif isinstance(e.reason, socket.timeout):
            return 'error', 'Connection timeout'
        else:
            return 'error', f'URL Error: {str(e.reason)}'

    except socket.timeout:
        return 'error', 'Connection timeout'

    except Exception as e:
        return 'error', f'Unexpected error: {str(e)}'

def verify_platforms():
    """Verify the last 100 platforms from platforms.json"""

    print("Loading platforms.json...")
    with open('platforms.json', 'r', encoding='utf-8') as f:
        all_platforms = json.load(f)

    # Get platforms 1012-1111 (indices 1011-1110)
    platforms_to_check = all_platforms[1011:1111]

    print(f"Verifying {len(platforms_to_check)} platforms (1012-1111)...\n")

    results = {
        'valid': [],
        'invalid': [],
        'error': [],
        'redirect': []
    }

    for i, platform in enumerate(platforms_to_check, start=1012):
        name = platform.get('name', 'Unknown')
        url = platform.get('url', '') or platform.get('website', '')

        print(f"[{i}/1111] Checking {name}: {url}...", end=' ')

        status, message = check_url(url)

        print(f"{status.upper()} - {message}")

        result_entry = {
            'index': i,
            'name': name,
            'url': url,
            'message': message
        }

        results[status].append(result_entry)

        # Small delay to avoid overwhelming servers
        time.sleep(0.5)

    return results

def generate_report(results):
    """Generate a markdown report of the verification results"""

    report = []
    report.append("# Platform Verification Report - Platforms 1012-1111")
    report.append(f"\nGenerated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"\nTotal platforms checked: 100\n")

    # Summary
    report.append("## Summary\n")
    report.append(f"- Valid platforms: {len(results['valid'])}")
    report.append(f"- Invalid/Fake platforms: {len(results['invalid'])}")
    report.append(f"- Redirected platforms: {len(results['redirect'])}")
    report.append(f"- Error/Unable to verify: {len(results['error'])}\n")

    # Known fake platforms
    known_fakes = ['shopai.com', 'auraflow.ai', 'neurasearch.io', 'videoforge.ai']
    report.append("## Known Fake Platforms (from user)")
    report.append("\nThe following platforms were identified as fake:\n")
    for fake in known_fakes:
        report.append(f"- {fake}")
    report.append("")

    # Invalid platforms
    if results['invalid']:
        report.append("## Invalid/Fake Platforms Detected\n")
        report.append("These platforms have non-existent domains or are parked domains:\n")
        report.append("| # | Platform Name | URL | Issue |")
        report.append("|---|---------------|-----|-------|")
        for entry in results['invalid']:
            report.append(f"| {entry['index']} | {entry['name']} | {entry['url']} | {entry['message']} |")
        report.append("")

    # Redirected platforms
    if results['redirect']:
        report.append("## Platforms with Suspicious Redirects\n")
        report.append("These platforms redirect to different domains (may be legitimate or suspicious):\n")
        report.append("| # | Platform Name | URL | Redirect Info |")
        report.append("|---|---------------|-----|---------------|")
        for entry in results['redirect']:
            report.append(f"| {entry['index']} | {entry['name']} | {entry['url']} | {entry['message']} |")
        report.append("")

    # Error platforms
    if results['error']:
        report.append("## Platforms with Verification Errors\n")
        report.append("These platforms could not be verified (may be temporary issues):\n")
        report.append("| # | Platform Name | URL | Error |")
        report.append("|---|---------------|-----|-------|")
        for entry in results['error']:
            report.append(f"| {entry['index']} | {entry['name']} | {entry['url']} | {entry['message']} |")
        report.append("")

    # Valid platforms
    if results['valid']:
        report.append("## Valid Platforms\n")
        report.append(f"These {len(results['valid'])} platforms appear to be legitimate and reachable:\n")
        report.append("<details>")
        report.append("<summary>Click to expand list</summary>\n")
        report.append("| # | Platform Name | URL | Status |")
        report.append("|---|---------------|-----|--------|")
        for entry in results['valid']:
            report.append(f"| {entry['index']} | {entry['name']} | {entry['url']} | {entry['message']} |")
        report.append("\n</details>\n")

    # Action items
    report.append("## Recommended Actions\n")
    if results['invalid']:
        report.append(f"1. **Remove {len(results['invalid'])} invalid/fake platforms** from platforms.json")
    if results['redirect']:
        report.append(f"2. **Review {len(results['redirect'])} redirected platforms** - verify if they are legitimate or should be updated")
    if results['error']:
        report.append(f"3. **Re-verify {len(results['error'])} platforms with errors** - these may be temporary issues")

    report.append("\n---\n")
    report.append("*This report was automatically generated by platform verification script*")

    return '\n'.join(report)

if __name__ == '__main__':
    try:
        results = verify_platforms()
        report = generate_report(results)

        # Save report
        with open('FAKE_PLATFORMS_REPORT.md', 'w', encoding='utf-8') as f:
            f.write(report)

        print("\n" + "="*60)
        print("VERIFICATION COMPLETE!")
        print("="*60)
        print(f"Valid platforms: {len(results['valid'])}")
        print(f"Invalid/Fake platforms: {len(results['invalid'])}")
        print(f"Redirected platforms: {len(results['redirect'])}")
        print(f"Error/Unable to verify: {len(results['error'])}")
        print(f"\nReport saved to: FAKE_PLATFORMS_REPORT.md")

    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
