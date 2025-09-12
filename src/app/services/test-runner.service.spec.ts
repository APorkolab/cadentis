import { TestBed } from '@angular/core/testing';
import { TestRunnerService, TestSuite, TestCase, TestReport, AITestGeneratorConfig } from './test-runner.service';

describe('TestRunnerService', () => {
  let service: TestRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestRunnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('test suite management', () => {
    it('should initialize with default test suites', (done) => {
      service.getTestSuites().subscribe(suites => {
        expect(suites.length).toBeGreaterThan(0);
        expect(suites[0].name).toContain('Prosody Analysis');
        done();
      });
    });

    it('should add new test suite', () => {
      const newSuite: TestSuite = {
        id: 'test_suite_1',
        name: 'Test Suite 1',
        description: 'Test description',
        tests: []
      };

      service.addTestSuite(newSuite);

      service.getTestSuites().subscribe(suites => {
        const addedSuite = suites.find(s => s.id === 'test_suite_1');
        expect(addedSuite).toBeDefined();
        expect(addedSuite?.name).toBe('Test Suite 1');
      });
    });

    it('should remove test suite', () => {
      const suiteId = 'prosody_analysis_suite';
      
      service.removeTestSuite(suiteId);
      
      service.getTestSuites().subscribe(suites => {
        const removedSuite = suites.find(s => s.id === suiteId);
        expect(removedSuite).toBeUndefined();
      });
    });

    it('should update test case', () => {
      const suiteId = 'prosody_analysis_suite';
      const updatedTest: TestCase = {
        id: 'test_syllable_detection',
        name: 'Updated Test Name',
        description: 'Updated description',
        category: 'unit',
        priority: 'high',
        status: 'pending',
        duration: 0,
        assertions: [],
        dependencies: [],
        tags: ['updated'],
        createdBy: 'human'
      };

      service.updateTestCase(suiteId, updatedTest);

      service.getTestSuites().subscribe(suites => {
        const suite = suites.find(s => s.id === suiteId);
        const test = suite?.tests.find(t => t.id === 'test_syllable_detection');
        expect(test?.name).toBe('Updated Test Name');
      });
    });
  });

  describe('AI test generation', () => {
    it('should generate tests with AI service', async () => {
      const componentCode = `
        export class TestComponent {
          calculate(a: number, b: number): number {
            return a + b;
          }
        }
      `;

      const tests = await service.generateTests('test-component', componentCode);

      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0].createdBy).toBe('ai');
      expect(tests[0].generated).toBeDefined();
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock AI service failure
      spyOn(service as any, 'callAIService').and.returnValue(Promise.reject('AI service error'));

      const tests = await service.generateTests('test-component', 'export class TestComponent {}');

      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0].tags).toContain('fallback');
    });

    it('should respect AI configuration settings', async () => {
      const config: Partial<AITestGeneratorConfig> = {
        maxTestsPerComponent: 2,
        includePerformanceTests: false
      };

      const tests = await service.generateTests('test-component', 'code', config);

      expect(tests.length).toBeLessThanOrEqual(2);
      expect(tests.every(t => t.category !== 'performance')).toBe(true);
    });
  });

  describe('test execution', () => {
    let testSuite: TestSuite;

    beforeEach(() => {
      testSuite = {
        id: 'execution_test_suite',
        name: 'Execution Test Suite',
        description: 'Suite for testing execution',
        tests: [
          {
            id: 'test_1',
            name: 'Test 1',
            description: 'First test',
            category: 'unit',
            priority: 'high',
            status: 'pending',
            duration: 0,
            assertions: [{
              id: 'assertion_1',
              description: 'Should pass',
              expected: true,
              type: 'equals'
            }],
            dependencies: [],
            tags: [],
            createdBy: 'human'
          }
        ]
      };

      service.addTestSuite(testSuite);
    });

    it('should run single test suite', async () => {
      const report = await service.runTestSuite('execution_test_suite');

      expect(report).toBeDefined();
      expect(report.summary.total).toBe(1);
      expect(report.results.length).toBe(1);
      expect(report.timestamp).toBeDefined();
    });

    it('should run all tests', async () => {
      const report = await service.runAllTests();

      expect(report).toBeDefined();
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.results.length).toBeGreaterThan(0);
    });

    it('should track test execution state', (done) => {
      service.isRunning().subscribe(running => {
        if (running) {
          expect(running).toBe(true);
          done();
        }
      });

      service.runTestSuite('execution_test_suite');
    });

    it('should handle non-existent test suite', async () => {
      try {
        await service.runTestSuite('non_existent_suite');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toContain('not found');
      }
    });
  });

  describe('test report generation', () => {
    it('should generate comprehensive test report', async () => {
      const report = await service.runAllTests();

      expect(report.id).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThanOrEqual(0);
      expect(report.summary.passed).toBeGreaterThanOrEqual(0);
      expect(report.summary.failed).toBeGreaterThanOrEqual(0);
      expect(report.summary.duration).toBeGreaterThanOrEqual(0);
      expect(report.performance).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should include coverage information', async () => {
      const report = await service.runAllTests();

      expect(report.summary.coverage).toBeDefined();
      expect(report.summary.coverage.overall).toBeGreaterThanOrEqual(0);
      expect(report.summary.coverage.lines).toBeGreaterThanOrEqual(0);
      expect(report.summary.coverage.functions).toBeGreaterThanOrEqual(0);
      expect(report.summary.coverage.branches).toBeGreaterThanOrEqual(0);
    });

    it('should generate actionable recommendations', async () => {
      // Create a scenario with failing tests
      const failingSuite: TestSuite = {
        id: 'failing_suite',
        name: 'Failing Suite',
        description: 'Suite with failing tests',
        tests: Array.from({ length: 5 }, (_, i) => ({
          id: `failing_test_${i}`,
          name: `Failing Test ${i}`,
          description: 'This test should fail',
          category: 'unit' as const,
          priority: 'medium' as const,
          status: 'pending' as const,
          duration: 0,
          assertions: [],
          dependencies: [],
          tags: [],
          createdBy: 'human' as const
        }))
      };

      service.addTestSuite(failingSuite);
      
      // Mock failing test results
      spyOn(service as any, 'runSingleTest').and.returnValue(Promise.resolve({
        testId: 'test',
        passed: false,
        duration: 2000,
        assertions: [],
        error: 'Test failed'
      }));

      const report = await service.runTestSuite('failing_suite');

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('hibaarány'))).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should update AI configuration', (done) => {
      const newConfig: Partial<AITestGeneratorConfig> = {
        enabled: false,
        maxTestsPerComponent: 5
      };

      service.updateConfig(newConfig);

      service.getConfig().subscribe(config => {
        expect(config.enabled).toBe(false);
        expect(config.maxTestsPerComponent).toBe(5);
        done();
      });
    });

    it('should maintain configuration consistency', () => {
      const config: Partial<AITestGeneratorConfig> = {
        confidenceThreshold: 0.95,
        includeSecurityTests: true
      };

      service.updateConfig(config);

      service.getConfig().subscribe(updatedConfig => {
        expect(updatedConfig.confidenceThreshold).toBe(0.95);
        expect(updatedConfig.includeSecurityTests).toBe(true);
        // Other properties should remain unchanged
        expect(updatedConfig.enabled).toBe(true);
        expect(updatedConfig.model).toBe('gpt-4');
      });
    });
  });

  describe('test categorization and execution', () => {
    it('should execute different test categories correctly', async () => {
      const categories: Array<TestCase['category']> = ['unit', 'integration', 'e2e', 'performance', 'accessibility', 'security'];
      
      const multiCategorySuite: TestSuite = {
        id: 'multi_category_suite',
        name: 'Multi Category Suite',
        description: 'Tests for all categories',
        tests: categories.map(category => ({
          id: `test_${category}`,
          name: `Test ${category}`,
          description: `${category} test`,
          category,
          priority: 'medium',
          status: 'pending',
          duration: 0,
          assertions: [],
          dependencies: [],
          tags: [category],
          createdBy: 'human'
        }))
      };

      service.addTestSuite(multiCategorySuite);
      const report = await service.runTestSuite('multi_category_suite');

      expect(report.results.length).toBe(categories.length);
      
      // Performance tests should generally take longer
      const perfTest = report.results.find(r => r.testId.includes('performance'));
      const unitTest = report.results.find(r => r.testId.includes('unit'));
      
      if (perfTest && unitTest) {
        expect(perfTest.duration).toBeGreaterThanOrEqual(unitTest.duration);
      }
    });

    it('should handle test dependencies correctly', async () => {
      const dependentSuite: TestSuite = {
        id: 'dependent_suite',
        name: 'Dependent Suite',
        description: 'Suite with test dependencies',
        tests: [
          {
            id: 'base_test',
            name: 'Base Test',
            description: 'Base test without dependencies',
            category: 'unit',
            priority: 'high',
            status: 'pending',
            duration: 0,
            assertions: [],
            dependencies: [],
            tags: [],
            createdBy: 'human'
          },
          {
            id: 'dependent_test',
            name: 'Dependent Test',
            description: 'Test that depends on base test',
            category: 'integration',
            priority: 'medium',
            status: 'pending',
            duration: 0,
            assertions: [],
            dependencies: ['base_test'],
            tags: [],
            createdBy: 'human'
          }
        ]
      };

      service.addTestSuite(dependentSuite);
      const report = await service.runTestSuite('dependent_suite');

      expect(report.results.length).toBe(2);
      
      // Both tests should have results
      const baseResult = report.results.find(r => r.testId === 'base_test');
      const dependentResult = report.results.find(r => r.testId === 'dependent_test');
      
      expect(baseResult).toBeDefined();
      expect(dependentResult).toBeDefined();
    });
  });

  describe('performance and scalability', () => {
    it('should handle large test suites efficiently', async () => {
      const largeSuite: TestSuite = {
        id: 'large_suite',
        name: 'Large Suite',
        description: 'Suite with many tests',
        tests: Array.from({ length: 100 }, (_, i) => ({
          id: `large_test_${i}`,
          name: `Large Test ${i}`,
          description: 'Performance test',
          category: 'unit',
          priority: 'low',
          status: 'pending',
          duration: 0,
          assertions: [],
          dependencies: [],
          tags: [],
          createdBy: 'human'
        }))
      };

      service.addTestSuite(largeSuite);
      
      const startTime = Date.now();
      const report = await service.runTestSuite('large_suite');
      const endTime = Date.now();
      
      expect(report.results.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should provide progress updates during long test runs', (done) => {
      const progressUpdates: boolean[] = [];
      
      service.isRunning().subscribe(running => {
        progressUpdates.push(running);
        
        if (progressUpdates.length >= 2) {
          expect(progressUpdates).toContain(true);
          expect(progressUpdates).toContain(false);
          done();
        }
      });

      service.runAllTests();
    });
  });

  describe('error handling and resilience', () => {
    it('should continue execution when individual tests fail', async () => {
      const mixedSuite: TestSuite = {
        id: 'mixed_results_suite',
        name: 'Mixed Results Suite',
        description: 'Suite with passing and failing tests',
        tests: [
          {
            id: 'passing_test',
            name: 'Passing Test',
            description: 'This test passes',
            category: 'unit',
            priority: 'medium',
            status: 'pending',
            duration: 0,
            assertions: [],
            dependencies: [],
            tags: [],
            createdBy: 'human'
          },
          {
            id: 'failing_test',
            name: 'Failing Test',
            description: 'This test fails',
            category: 'unit',
            priority: 'medium',
            status: 'pending',
            duration: 0,
            assertions: [],
            dependencies: [],
            tags: [],
            createdBy: 'human'
          }
        ]
      };

      service.addTestSuite(mixedSuite);
      const report = await service.runTestSuite('mixed_results_suite');

      expect(report.results.length).toBe(2);
      expect(report.summary.total).toBe(2);
      // Should have completed both tests regardless of failures
    });

    it('should handle malformed test configurations', () => {
      const malformedSuite: TestSuite = {
        id: 'malformed_suite',
        name: 'Malformed Suite',
        description: 'Suite with malformed tests',
        tests: [
          {
            id: '',
            name: '',
            description: '',
            category: 'unit',
            priority: 'medium',
            status: 'pending',
            duration: 0,
            assertions: [],
            dependencies: [],
            tags: [],
            createdBy: 'human'
          } as TestCase
        ]
      };

      expect(() => service.addTestSuite(malformedSuite)).not.toThrow();
    });
  });
});
