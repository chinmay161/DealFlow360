/**
 * RuleRegistry — Self-registration store for Rule instances.
 *
 * Rules register themselves at bootstrap time. The engine reads the
 * registry to determine which rules to execute.
 */

import type { Rule } from "../interfaces/Rule.js";
import { createModuleLogger } from "../../../lib/logger.js";

const log = createModuleLogger("rule-registry");

export class RuleRegistry {
  private static instance: RuleRegistry;
  private readonly rules = new Map<string, Rule>();

  private constructor() {}

  /** Get the singleton registry. */
  static getInstance(): RuleRegistry {
    if (!RuleRegistry.instance) {
      RuleRegistry.instance = new RuleRegistry();
    }
    return RuleRegistry.instance;
  }

  /**
   * Register a rule. Duplicate IDs are rejected with a warning.
   */
  register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      log.warn({ ruleId: rule.id }, "Duplicate rule registration ignored");
      return;
    }
    this.rules.set(rule.id, rule);
    log.info({ ruleId: rule.id, ruleName: rule.name }, "Rule registered");
  }

  /** Return all registered rules in insertion order. */
  getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  /** Retrieve a single rule by ID, or undefined. */
  get(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  /** Number of registered rules. */
  get size(): number {
    return this.rules.size;
  }

  /** Remove all rules (useful in tests). */
  clear(): void {
    this.rules.clear();
  }
}
