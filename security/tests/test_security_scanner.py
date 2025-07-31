#!/usr/bin/env python3
"""
Test Suite für Security Expert Agent S7
Testet die Security-Scanner-Funktionalität und Integration
"""

import unittest
import json
import os
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Füge Security Scanner zum Python Path hinzu
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scanner'))

try:
    from security_scanner import SecurityScanner
except ImportError:
    # Fallback für Tests ohne vollständige Scanner-Installation
    SecurityScanner = None


class TestSecurityScanner(unittest.TestCase):
    """Test Suite für Security Scanner"""
    
    def setUp(self):
        """Setup für jeden Test"""
        if SecurityScanner is None:
            self.skipTest("SecurityScanner nicht verfügbar")
            
        self.test_dir = tempfile.mkdtemp()
        self.source_dir = Path(self.test_dir) / "src"
        self.reports_dir = Path(self.test_dir) / "reports"
        
        # Erstelle Test-Verzeichnisstruktur
        self.source_dir.mkdir(parents=True)
        self.reports_dir.mkdir(parents=True)
        
        # Mock Security Scanner mit Test-Verzeichnissen
        self.scanner = SecurityScanner()
        self.scanner.source_dir = self.source_dir
        self.scanner.reports_dir = self.reports_dir
    
    def tearDown(self):
        """Cleanup nach jedem Test"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_scanner_initialization(self):
        """Test: Scanner Initialisierung"""
        self.assertIsInstance(self.scanner, SecurityScanner)
        self.assertEqual(len(self.scanner.tools), 6)  # 6 konfigurierte Tools
        self.assertTrue(self.scanner.tools['semgrep']['enabled'])
        self.assertTrue(self.scanner.tools['trivy']['enabled'])
    
    def test_generate_recommendations_no_issues(self):
        """Test: Empfehlungen ohne Security-Issues"""
        # Setup: Keine Security-Issues
        self.scanner.scan_results = {
            'semgrep': {'status': 'success', 'critical_issues': 0},
            'trivy': {'status': 'success', 'critical_vulnerabilities': 0},
            'gitleaks': {'status': 'success', 'secrets_found': 0}
        }
        
        recommendations = self.scanner.generate_recommendations()
        
        # Verify: Standard-Empfehlungen ohne kritische Issues
        self.assertIn("✅ Continue regular security monitoring", recommendations)
        self.assertIn("🔄 Keep all dependencies up to date", recommendations)
    
    def test_generate_recommendations_with_secrets(self):
        """Test: Empfehlungen bei gefundenen Secrets"""
        # Setup: Secrets gefunden
        self.scanner.scan_results = {
            'gitleaks': {'status': 'success', 'secrets_found': 2}
        }
        
        recommendations = self.scanner.generate_recommendations()
        
        # Verify: Kritische Empfehlung für Secrets
        critical_rec = "🚨 CRITICAL: Remove all secrets from repository immediately"
        self.assertIn(critical_rec, recommendations)
    
    def test_generate_recommendations_with_vulnerabilities(self):
        """Test: Empfehlungen bei Vulnerabilities"""
        # Setup: Verschiedene Vulnerability-Arten
        self.scanner.scan_results = {
            'dependency_check': {'status': 'success', 'critical_vulnerabilities': 3},
            'semgrep': {'status': 'success', 'critical_issues': 1},
            'trivy': {'status': 'success', 'critical_vulnerabilities': 2}
        }
        
        recommendations = self.scanner.generate_recommendations()
        
        # Verify: Spezifische Empfehlungen für jede Vulnerability-Art
        self.assertIn("🔄 Update dependencies with known security vulnerabilities", recommendations)
        self.assertIn("🔍 Review and fix SAST findings in source code", recommendations)
        self.assertIn("🐳 Update base images and fix container vulnerabilities", recommendations)
    
    def test_check_owasp_compliance(self):
        """Test: OWASP Top 10 Compliance Check"""
        compliance = self.scanner.check_owasp_compliance()
        
        # Verify: OWASP Compliance Structure
        self.assertIn('A01_broken_access_control', compliance)
        self.assertIn('A02_cryptographic_failures', compliance)
        self.assertIn('A03_injection', compliance)
        
        # Default sollte PASS sein
        self.assertEqual(compliance['A01_broken_access_control'], 'PASS')
    
    def test_check_owasp_compliance_with_issues(self):
        """Test: OWASP Compliance mit kritischen Issues"""
        # Setup: Kritische Semgrep-Issues (Injection-related)
        self.scanner.scan_results = {
            'semgrep': {'status': 'success', 'critical_issues': 5}
        }
        
        compliance = self.scanner.check_owasp_compliance()
        
        # Verify: A03 (Injection) sollte Review erfordern
        self.assertEqual(compliance['A03_injection'], 'REVIEW_REQUIRED')
    
    def test_check_sans_compliance(self):
        """Test: SANS Top 25 CWE Compliance"""
        compliance = self.scanner.check_sans_compliance()
        
        # Verify: SANS Compliance Structure
        self.assertIn('cwe_79_xss', compliance)
        self.assertIn('cwe_89_sql_injection', compliance)
        self.assertIn('cwe_22_path_traversal', compliance)
    
    def test_check_privacy_compliance(self):
        """Test: Privacy/GDPR Compliance"""
        compliance = self.scanner.check_privacy_compliance()
        
        # Verify: Privacy Compliance Structure
        self.assertIn('data_minimization', compliance)
        self.assertIn('purpose_limitation', compliance)
        self.assertIn('storage_limitation', compliance)
    
    def test_generate_security_report(self):
        """Test: Security Report Generation"""
        # Setup: Mock Scan Results
        self.scanner.scan_results = {
            'semgrep': {
                'status': 'success',
                'total_issues': 5,
                'critical_issues': 1
            },
            'trivy': {
                'status': 'success', 
                'total_vulnerabilities': 3,
                'critical_vulnerabilities': 0
            },
            'gitleaks': {
                'status': 'success',
                'secrets_found': 0
            }
        }
        
        report = self.scanner.generate_security_report()
        
        # Verify: Report Structure
        self.assertIn('scan_metadata', report)
        self.assertIn('security_summary', report)
        self.assertIn('tool_results', report)
        self.assertIn('recommendations', report)
        self.assertIn('compliance_status', report)
        
        # Verify: Security Summary
        summary = report['security_summary']
        self.assertEqual(summary['total_issues'], 8)  # 5 + 3 + 0
        self.assertEqual(summary['critical_issues'], 1)  # 1 + 0 + 0
        self.assertGreater(summary['security_score'], 0)
        self.assertIn(summary['risk_level'], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    
    def test_security_score_calculation(self):
        """Test: Security Score Berechnung"""
        # Setup: Verschiedene Szenarien
        test_cases = [
            # (critical_issues, total_issues, expected_min_score, expected_max_score)
            (0, 0, 100, 100),      # Perfekt
            (1, 1, 70, 80),        # 1 Critical Issue
            (0, 10, 70, 85),       # 10 Minor Issues
            (5, 20, 0, 40),        # Viele Issues
        ]
        
        for critical, total, min_score, max_score in test_cases:
            with self.subTest(critical=critical, total=total):
                # Mock Results
                self.scanner.scan_results = {
                    'test_tool': {
                        'status': 'success',
                        'critical_issues': critical,
                        'total_issues': total
                    }
                }
                
                report = self.scanner.generate_security_report()
                score = report['security_summary']['security_score']
                
                self.assertGreaterEqual(score, min_score)
                self.assertLessEqual(score, max_score)
    
    @patch('subprocess.run')
    def test_run_semgrep_scan_success(self, mock_run):
        """Test: Erfolgreicher Semgrep Scan"""
        # Setup: Mock successful Semgrep output
        mock_output = {
            "results": [
                {
                    "message": "Potential SQL injection",
                    "extra": {"severity": "ERROR"}
                },
                {
                    "message": "XSS vulnerability", 
                    "extra": {"severity": "WARNING"}
                }
            ]
        }
        
        mock_run.return_value = Mock(
            returncode=0,
            stdout=json.dumps(mock_output),
            stderr=""
        )
        
        result = self.scanner.run_semgrep_scan()
        
        # Verify: Success Result
        self.assertEqual(result['tool'], 'semgrep')
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['total_issues'], 2)
        self.assertEqual(result['critical_issues'], 2)  # Beide sind ERROR/WARNING
    
    @patch('subprocess.run')
    def test_run_semgrep_scan_failure(self, mock_run):
        """Test: Semgrep Scan Fehler"""
        # Setup: Mock failed Semgrep
        mock_run.return_value = Mock(
            returncode=1,
            stdout="",
            stderr="Semgrep error: invalid configuration"
        )
        
        result = self.scanner.run_semgrep_scan()
        
        # Verify: Error Result
        self.assertEqual(result['tool'], 'semgrep')
        self.assertEqual(result['status'], 'error')
        self.assertIn('error', result)
    
    @patch('subprocess.run')
    def test_run_gitleaks_scan_secrets_found(self, mock_run):
        """Test: GitLeaks findet Secrets"""
        # Setup: Mock GitLeaks mit Secrets
        mock_secrets = [
            {
                "Description": "AWS Access Key",
                "File": "config.js",
                "Secret": "AKIAIOSFODNN7EXAMPLE"
            }
        ]
        
        # GitLeaks schreibt JSON-Report
        report_file = self.reports_dir / "gitleaks-report.json"
        with open(report_file, 'w') as f:
            json.dump(mock_secrets, f)
        
        mock_run.return_value = Mock(
            returncode=1,  # GitLeaks returniert 1 wenn Secrets gefunden
            stdout="",
            stderr=""
        )
        
        result = self.scanner.run_gitleaks_scan()
        
        # Verify: Secrets Found
        self.assertEqual(result['tool'], 'gitleaks')
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['secrets_found'], 1)
        self.assertEqual(result['return_code'], 1)
    
    @patch('subprocess.run')
    def test_run_gitleaks_scan_no_secrets(self, mock_run):
        """Test: GitLeaks findet keine Secrets"""
        # Setup: Mock GitLeaks ohne Secrets (leere Datei)
        report_file = self.reports_dir / "gitleaks-report.json"
        with open(report_file, 'w') as f:
            json.dump([], f)
        
        mock_run.return_value = Mock(
            returncode=0,  # GitLeaks returniert 0 wenn keine Secrets
            stdout="",
            stderr=""
        )
        
        result = self.scanner.run_gitleaks_scan()
        
        # Verify: No Secrets
        self.assertEqual(result['tool'], 'gitleaks')
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['secrets_found'], 0)
        self.assertEqual(result['return_code'], 0)


class TestSecurityIntegration(unittest.TestCase):
    """Integration Tests für Security Expert Agent S7"""
    
    def test_security_agent_s7_configuration(self):
        """Test: Agent S7 Konfiguration"""
        # Test ob alle erforderlichen Konfigurationsdateien existieren
        config_files = [
            'config/sub-agents/CLAUDE-security-expert.md',
            'security/config/security-settings.json',
            'security/config/sonarqube-quality-gate.json',
            'security/config/dependency-check-suppressions.xml'
        ]
        
        project_root = Path(__file__).parent.parent.parent
        
        for config_file in config_files:
            file_path = project_root / config_file
            self.assertTrue(file_path.exists(), f"Configuration file missing: {config_file}")
    
    def test_github_actions_workflows(self):
        """Test: GitHub Actions Security Workflows"""
        workflows = [
            '.github/workflows/security-scan-pr.yml',
            '.github/workflows/security-daily-scan.yml'
        ]
        
        project_root = Path(__file__).parent.parent.parent
        
        for workflow in workflows:
            workflow_path = project_root / workflow
            self.assertTrue(workflow_path.exists(), f"Workflow missing: {workflow}")
            
            # Prüfe Workflow-Syntax (basic)
            with open(workflow_path, 'r') as f:
                content = f.read()
                self.assertIn('name:', content)
                self.assertIn('on:', content)
                self.assertIn('jobs:', content)
    
    def test_docker_compose_security_template(self):
        """Test: Docker Compose Security Template"""
        project_root = Path(__file__).parent.parent.parent
        template_path = project_root / 'docker-compose.security-agent-template.yml'
        
        self.assertTrue(template_path.exists(), "Security Docker Compose template missing")
        
        with open(template_path, 'r') as f:
            content = f.read()
            
            # Prüfe Security-spezifische Services
            self.assertIn('sonarqube-{SUB_AGENT_ID}', content)
            self.assertIn('owasp-zap-{SUB_AGENT_ID}', content)
            self.assertIn('security-scanner-{SUB_AGENT_ID}', content)
            
            # Prüfe Port-Platzhalter
            self.assertIn('{SONARQUBE_PORT}', content)
            self.assertIn('{ZAP_PORT}', content)
    
    def test_security_documentation(self):
        """Test: Security Dokumentation"""
        project_root = Path(__file__).parent.parent.parent
        doc_path = project_root / 'SECURITY_EXPERT_AGENT_S7.md'
        
        self.assertTrue(doc_path.exists(), "Security documentation missing")
        
        with open(doc_path, 'r') as f:
            content = f.read()
            
            # Prüfe wichtige Dokumentations-Abschnitte
            self.assertIn('# 🔐 Security Expert Agent S7', content)
            self.assertIn('## 🎯 Kernfunktionen', content)
            self.assertIn('## 🛠 Technische Implementierung', content)
            self.assertIn('SAST', content)
            self.assertIn('DAST', content)
            self.assertIn('SCA', content)


class TestSecurityPolicies(unittest.TestCase):
    """Tests für Security Policies und Standards"""
    
    def test_owasp_top_10_coverage(self):
        """Test: OWASP Top 10 Coverage"""
        owasp_categories = [
            'A01_broken_access_control',
            'A02_cryptographic_failures', 
            'A03_injection',
            'A04_insecure_design',
            'A05_security_misconfiguration',
            'A06_vulnerable_components',
            'A07_identification_failures',
            'A08_software_integrity_failures',
            'A09_logging_failures',
            'A10_ssrf'
        ]
        
        if SecurityScanner:
            scanner = SecurityScanner()
            compliance = scanner.check_owasp_compliance()
            
            # Mindestens 3 OWASP-Kategorien sollten überprüft werden
            self.assertGreaterEqual(len(compliance), 3)
            
            for category in compliance:
                self.assertIn(compliance[category], ['PASS', 'REVIEW_REQUIRED', 'FAIL'])
    
    def test_sans_top_25_coverage(self):
        """Test: SANS Top 25 CWE Coverage"""
        critical_cwes = [
            'cwe_79_xss',           # Cross-site Scripting
            'cwe_89_sql_injection', # SQL Injection
            'cwe_22_path_traversal' # Path Traversal
        ]
        
        if SecurityScanner:
            scanner = SecurityScanner()
            compliance = scanner.check_sans_compliance()
            
            for cwe in critical_cwes:
                self.assertIn(cwe, compliance)
                self.assertIn(compliance[cwe], ['PASS', 'REVIEW_REQUIRED', 'FAIL'])


if __name__ == '__main__':
    # Test-Suite ausführen
    print("🔐 Running Security Expert Agent S7 Test Suite...")
    print("=" * 60)
    
    # Erstelle Test Suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Füge Test-Klassen hinzu
    suite.addTests(loader.loadTestsFromTestCase(TestSecurityScanner))
    suite.addTests(loader.loadTestsFromTestCase(TestSecurityIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestSecurityPolicies))
    
    # Führe Tests aus
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Test-Ergebnis
    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("✅ All Security Expert Agent S7 tests passed!")
        exit_code = 0
    else:
        print(f"❌ {len(result.failures)} test(s) failed, {len(result.errors)} error(s)")
        exit_code = 1
    
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    exit(exit_code)