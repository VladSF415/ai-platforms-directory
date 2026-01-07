#!/usr/bin/env python3
"""
Schema Validation Script for aiplatformslist.com
Validates JSON-LD structured data for SEO rich snippets

Requirements:
    pip install requests beautifulsoup4 jsonschema

Usage:
    python scripts/validate_schema.py
    python scripts/validate_schema.py --url https://aiplatformslist.com/platform/chatgpt
"""

import json
import re
import sys
import argparse
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
    from jsonschema import validate, ValidationError
except ImportError:
    print("ERROR: Missing dependencies. Install with:")
    print("  pip install requests beautifulsoup4 jsonschema")
    sys.exit(1)


# Schema.org validation schemas
SOFTWARE_APPLICATION_SCHEMA = {
    "type": "object",
    "required": ["@context", "@type", "name", "description"],
    "properties": {
        "@context": {"const": "https://schema.org"},
        "@type": {"const": "SoftwareApplication"},
        "name": {"type": "string", "minLength": 1},
        "description": {"type": "string", "minLength": 10},
        "url": {"type": "string", "format": "uri"},
        "applicationCategory": {"type": "string"},
        "offers": {"type": "object"},
        "aggregateRating": {"type": "object"},
    }
}

BREADCRUMB_SCHEMA = {
    "type": "object",
    "required": ["@context", "@type", "itemListElement"],
    "properties": {
        "@context": {"const": "https://schema.org"},
        "@type": {"const": "BreadcrumbList"},
        "itemListElement": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["@type", "position", "name", "item"],
                "properties": {
                    "@type": {"const": "ListItem"},
                    "position": {"type": "integer", "minimum": 1},
                    "name": {"type": "string"},
                    "item": {"type": "string", "format": "uri"},
                }
            }
        }
    }
}

ITEM_LIST_SCHEMA = {
    "type": "object",
    "required": ["@context", "@type", "itemListElement"],
    "properties": {
        "@context": {"const": "https://schema.org"},
        "@type": {"const": "ItemList"},
        "name": {"type": "string"},
        "numberOfItems": {"type": "integer", "minimum": 0},
        "itemListElement": {"type": "array"}
    }
}


class SchemaValidator:
    """Validates JSON-LD schema markup from URLs or HTML"""

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results = []

    def extract_json_ld(self, html: str) -> List[Dict[str, Any]]:
        """Extract all JSON-LD scripts from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        scripts = soup.find_all('script', type='application/ld+json')

        schemas = []
        for script in scripts:
            try:
                schema = json.loads(script.string)
                schemas.append(schema)
            except json.JSONDecodeError as e:
                print(f"  ❌ Invalid JSON in script tag: {e}")

        return schemas

    def validate_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a schema against expected structure"""
        schema_type = schema.get('@type')

        result = {
            'type': schema_type,
            'valid': False,
            'errors': [],
            'warnings': []
        }

        try:
            if schema_type == 'SoftwareApplication':
                validate(instance=schema, schema=SOFTWARE_APPLICATION_SCHEMA)
                result['valid'] = True

                # Additional checks
                if 'offers' not in schema:
                    result['warnings'].append("Missing 'offers' (pricing info)")
                if 'aggregateRating' not in schema:
                    result['warnings'].append("Missing 'aggregateRating' (user ratings)")
                if 'featureList' not in schema:
                    result['warnings'].append("Missing 'featureList' (product features)")

            elif schema_type == 'BreadcrumbList':
                validate(instance=schema, schema=BREADCRUMB_SCHEMA)
                result['valid'] = True

            elif schema_type == 'ItemList':
                validate(instance=schema, schema=ITEM_LIST_SCHEMA)
                result['valid'] = True

                if len(schema.get('itemListElement', [])) == 0:
                    result['warnings'].append("Empty itemListElement array")

            elif schema_type == 'WebSite':
                result['valid'] = True  # Basic website schema is fine

            else:
                result['warnings'].append(f"Unknown schema type: {schema_type}")

        except ValidationError as e:
            result['errors'].append(str(e.message))

        return result

    def test_url(self, url: str) -> Dict[str, Any]:
        """Test a single URL for schema markup"""
        print(f"\n🔍 Testing: {url}")

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            return {
                'url': url,
                'error': f"Failed to fetch URL: {e}",
                'schemas': []
            }

        schemas = self.extract_json_ld(response.text)

        if not schemas:
            print(f"  ⚠️  No JSON-LD schemas found")
            return {
                'url': url,
                'error': "No JSON-LD schemas found",
                'schemas': []
            }

        print(f"  ✓ Found {len(schemas)} schema(s)")

        results = []
        for schema in schemas:
            result = self.validate_schema(schema)
            results.append(result)

            status = "✅" if result['valid'] else "❌"
            print(f"  {status} {result['type']}")

            for error in result['errors']:
                print(f"     ERROR: {error}")

            for warning in result['warnings']:
                print(f"     WARNING: {warning}")

        return {
            'url': url,
            'schemas': results
        }

    def test_platforms(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Test random platform pages"""
        print("\n📋 Testing Platform Pages...")

        try:
            platforms_response = requests.get(f"{self.base_url}/api/platforms?limit={limit}")
            platforms_response.raise_for_status()
            platforms_data = platforms_response.json()
            platforms = platforms_data.get('platforms', [])

        except requests.RequestException as e:
            print(f"ERROR: Failed to fetch platforms: {e}")
            return []

        results = []
        for platform in platforms[:limit]:
            slug = platform.get('slug') or platform.get('id')
            url = f"{self.base_url}/platform/{slug}"
            result = self.test_url(url)
            results.append(result)

        return results

    def test_categories(self) -> List[Dict[str, Any]]:
        """Test category pages"""
        print("\n📁 Testing Category Pages...")

        categories = [
            'computer-vision',
            'ml-frameworks',
            'code-ai',
            'llms',
            'generative-ai',
            'nlp',
            'image-generation',
            'analytics-bi',
            'video-ai',
            'video-generation'
        ]

        results = []
        for category in categories:
            url = f"{self.base_url}/category/{category}"
            result = self.test_url(url)
            results.append(result)

        return results

    def generate_report(self, all_results: List[Dict[str, Any]]) -> None:
        """Generate summary report"""
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)

        total_urls = len(all_results)
        total_schemas = sum(len(r.get('schemas', [])) for r in all_results)
        valid_schemas = sum(
            sum(1 for s in r.get('schemas', []) if s.get('valid', False))
            for r in all_results
        )

        print(f"URLs Tested: {total_urls}")
        print(f"Schemas Found: {total_schemas}")
        print(f"Valid Schemas: {valid_schemas}/{total_schemas}")

        if total_schemas > 0:
            success_rate = (valid_schemas / total_schemas) * 100
            print(f"Success Rate: {success_rate:.1f}%")

            if success_rate == 100:
                print("\n🎉 ALL SCHEMAS VALID! Ready for Google Rich Results.")
            elif success_rate >= 90:
                print("\n✅ Schemas mostly valid. Review warnings above.")
            else:
                print("\n⚠️  Many schema issues found. Review errors above.")
        else:
            print("\n❌ NO SCHEMAS FOUND! Schema implementation needed.")

        print("="*60)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Validate JSON-LD schema markup')
    parser.add_argument('--url', help='Test a specific URL')
    parser.add_argument('--base-url', default='http://localhost:3000',
                        help='Base URL for testing (default: http://localhost:3000)')
    parser.add_argument('--platforms', type=int, default=5,
                        help='Number of platform pages to test (default: 5)')
    parser.add_argument('--skip-categories', action='store_true',
                        help='Skip category page testing')
    args = parser.parse_args()

    validator = SchemaValidator(base_url=args.base_url)

    if args.url:
        # Test single URL
        result = validator.test_url(args.url)
        validator.generate_report([result])
    else:
        # Test homepage
        print("🏠 Testing Homepage...")
        homepage_result = validator.test_url(args.base_url)

        # Test platforms
        platform_results = validator.test_platforms(limit=args.platforms)

        # Test categories
        category_results = []
        if not args.skip_categories:
            category_results = validator.test_categories()

        # Generate report
        all_results = [homepage_result] + platform_results + category_results
        validator.generate_report(all_results)


if __name__ == '__main__':
    main()
