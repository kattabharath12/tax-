
/**
 * Complete State Tax Calculation Engine for 2025 Tax Year
 * Professional-grade implementation for tax preparation software
 * Designed by Senior Software Developer, Tax Accountant, and IRS expertise
 * 
 * @version 2025.1.0
 * @author Tax Calculation Engine Team
 */

export interface StateTaxResult {
  state: string;
  stateName: string;
  taxType: string;
  stateTax: number;
  effectiveRate: number;
  marginalRate: number;
  taxableIncome: number;
  standardDeduction?: number;
  personalExemption?: number;
  credits: Array<{
    name: string;
    amount: number;
  }>;
  breakdown: Array<{
    bracket: string;
    taxableAmount: number;
    rate: number;
    tax: number;
  }>;
  notes: string[];
}

export interface TaxBracket {
  min: number;
  rate: number;
}

export interface StateConfig {
  state: string;
  name: string;
  type: 'NO_TAX' | 'FLAT' | 'PROGRESSIVE' | 'SPECIAL';
  brackets?: {
    single: TaxBracket[];
    marriedFilingJointly: TaxBracket[];
    marriedFilingSeparately: TaxBracket[];
    headOfHousehold: TaxBracket[];
  };
  standardDeduction?: {
    single: number;
    marriedFilingJointly: number;
    marriedFilingSeparately: number;
    headOfHousehold: number;
  } | number;
  personalExemption?: {
    taxpayer: number;
    spouse: number;
    dependent: number;
    phaseOut?: {
      startIncome: number;
      rate: number;
    };
  };
  credits?: Array<{
    name: string;
    amount: number;
    condition?: string;
    filingStatus?: string;
  }>;
  specialTaxType?: 'DIVIDENDS_INTEREST' | 'CAPITAL_GAINS';
  rate?: number;
  exemption?: number;
  usesFederalAGI?: boolean;
  allowsItemization?: boolean;
  additionalDeductionFor65Plus?: number;
  additionalDeductionForBlind?: number;
  notes?: string[];
}

export class StateTaxCalculator2025 {
  private taxYear = 2025;
  private stateConfigs: Record<string, StateConfig>;
  private federalStandardDeductions = {
    single: 15000,        // 2025 estimated
    marriedFilingJointly: 30000,   // 2025 estimated  
    marriedFilingSeparately: 15000, // 2025 estimated
    headOfHousehold: 22500  // 2025 estimated
  };

  constructor() {
    this.stateConfigs = this.initializeStateConfigs2025();
  }

  /**
   * Main calculation method for 2025
   */
  /**
   * Normalize state input to handle various formats
   */
  private normalizeState(stateInput: string): string {
    if (!stateInput) return '';
    
    const input = stateInput.trim().toUpperCase();
    
    // Handle common state name to abbreviation mappings
    const stateNameMap: Record<string, string> = {
      'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
      'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
      'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
      'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
      'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
      'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH',
      'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC',
      'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA',
      'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN',
      'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA',
      'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC'
    };

    // If it's a full state name, convert to abbreviation
    if (stateNameMap[input]) {
      return stateNameMap[input];
    }

    // If it's already an abbreviation, return it
    if (input.length === 2 && /^[A-Z]{2}$/.test(input)) {
      return input;
    }

    // Handle common variations
    const variations: Record<string, string> = {
      'CALIF': 'CA', 'CAL': 'CA', 'CALI': 'CA',
      'FLA': 'FL', 'FLOR': 'FL',
      'TEX': 'TX',
      'NY': 'NY', 'NYC': 'NY',
      'PENN': 'PA', 'PENNA': 'PA'
    };

    return variations[input] || input;
  }

  calculateStateTax(taxData: {
    state: string;
    filingStatus: string;
    income: number;
    federalAGI: number;
    itemizedDeductions?: number;
    dependents?: number;
    age?: number;
    isBlind?: boolean;
    spouseAge?: number;
    spouseIsBlind?: boolean;
    dividends?: number;
    interest?: number;
    capitalGains?: number;
    dependentsUnder17?: number;
    dependentsOver17?: number;
  }): StateTaxResult {
    console.log('🏛️ STATE TAX CALCULATOR: Input received:', taxData);
    
    const {
      state: rawState,
      filingStatus,
      income,
      federalAGI,
      itemizedDeductions = 0,
      dependents = 0,
      age = 0,
      isBlind = false,
      spouseAge = 0,
      spouseIsBlind = false,
    } = taxData;

    // Normalize state input
    const state = this.normalizeState(rawState);
    console.log(`🏛️ STATE TAX CALCULATOR: Normalized '${rawState}' to '${state}'`);

    const stateConfig = this.stateConfigs[state];
    if (!stateConfig) {
      console.error(`❌ STATE TAX CALCULATOR: Invalid/unsupported state: '${state}' (original: '${rawState}')`);
      console.log('📋 Available states:', Object.keys(this.stateConfigs).join(', '));
      
      // Return a result indicating unsupported state instead of throwing
      return {
        state: state,
        stateName: `${rawState} (Unsupported)`,
        taxType: 'Unsupported State',
        stateTax: 0,
        effectiveRate: 0,
        marginalRate: 0,
        taxableIncome: 0,
        credits: [],
        breakdown: [],
        notes: [`State '${rawState}' is not supported in this version. Please consult a tax professional for ${rawState} state tax calculations.`]
      };
    }
    
    console.log(`✅ STATE TAX CALCULATOR: Found config for ${stateConfig.name}`);
    console.log(`📊 STATE TAX CALCULATOR: Tax type: ${stateConfig.type}`);

    try {
      // No income tax states
      if (stateConfig.type === 'NO_TAX') {
        console.log(`🏛️ STATE TAX CALCULATOR: ${stateConfig.name} is a no-tax state`);
        return {
          state: state.toUpperCase(),
          stateName: stateConfig.name,
          taxType: 'No State Income Tax',
          stateTax: 0,
          effectiveRate: 0,
          marginalRate: 0,
          taxableIncome: 0,
          credits: [],
          breakdown: [],
          notes: stateConfig.notes || ['This state does not impose a personal income tax.']
        };
      }

      // Special tax states (dividends/interest only, capital gains only)
      if (stateConfig.type === 'SPECIAL') {
        console.log(`🏛️ STATE TAX CALCULATOR: ${stateConfig.name} is a special tax state`);
        return this.calculateSpecialTax(stateConfig, taxData);
      }

      console.log(`🏛️ STATE TAX CALCULATOR: Calculating ${stateConfig.type} tax for ${stateConfig.name}`);
      
      // Calculate taxable income
      const taxableIncome = this.calculateTaxableIncome(stateConfig, taxData);
      console.log(`📊 STATE TAX CALCULATOR: Taxable income: $${taxableIncome.toLocaleString()}`);
      
      // Calculate tax based on brackets
      const taxCalculation = this.calculateBracketedTax(stateConfig, taxableIncome, filingStatus);
      console.log(`📊 STATE TAX CALCULATOR: Tax before credits: $${taxCalculation.totalTax.toLocaleString()}`);
      
      // Apply credits
      const afterCredits = this.applyCredits(stateConfig, taxCalculation, taxData);
      console.log(`📊 STATE TAX CALCULATOR: Final tax after credits: $${afterCredits.totalTax.toLocaleString()}`);
      
      const result = {
        state: state.toUpperCase(),
        stateName: stateConfig.name,
        taxType: stateConfig.type === 'FLAT' ? 'Flat Rate' : 'Progressive',
        stateTax: Math.max(0, afterCredits.totalTax),
        effectiveRate: income > 0 ? (afterCredits.totalTax / income) * 100 : 0,
        marginalRate: taxCalculation.marginalRate * 100,
        taxableIncome,
        standardDeduction: taxCalculation.standardDeduction,
        personalExemption: taxCalculation.personalExemption,
        credits: afterCredits.credits,
        breakdown: taxCalculation.breakdown,
        notes: stateConfig.notes || []
      };

      console.log(`✅ STATE TAX CALCULATOR: Calculation complete for ${stateConfig.name}:`, result);
      return result;

    } catch (error) {
      console.error(`❌ STATE TAX CALCULATOR: Error calculating tax for ${state}:`, error);
      console.error(`Stack trace:`, (error as Error)?.stack);
      
      // Return error result instead of throwing
      return {
        state: state.toUpperCase(),
        stateName: stateConfig?.name || `${rawState} (Error)`,
        taxType: 'Calculation Error',
        stateTax: 0,
        effectiveRate: 0,
        marginalRate: 0,
        taxableIncome: 0,
        credits: [],
        breakdown: [],
        notes: [`Error calculating state tax: ${(error as Error)?.message || 'Unknown error'}. Please consult a tax professional.`]
      };
    }
  }

  private calculateTaxableIncome(stateConfig: StateConfig, taxData: any): number {
    const { income, federalAGI, itemizedDeductions, filingStatus, dependents, age, isBlind, spouseAge, spouseIsBlind } = taxData;
    
    let adjustedGrossIncome = income;
    
    // Some states use federal AGI as starting point
    if (stateConfig.usesFederalAGI) {
      adjustedGrossIncome = federalAGI;
    }

    // Calculate standard deduction
    let standardDeduction = this.getStandardDeduction(stateConfig, filingStatus, age, isBlind, spouseAge, spouseIsBlind);
    
    // Choose higher of standard or itemized (if state allows itemization)
    let deduction = standardDeduction;
    if (stateConfig.allowsItemization && itemizedDeductions > standardDeduction) {
      deduction = itemizedDeductions;
    }

    // Subtract deductions
    let taxableIncome = Math.max(0, adjustedGrossIncome - deduction);

    // Apply personal exemptions
    const personalExemption = this.getPersonalExemption(stateConfig, filingStatus, dependents, adjustedGrossIncome);
    taxableIncome = Math.max(0, taxableIncome - personalExemption);

    return taxableIncome;
  }

  private calculateBracketedTax(stateConfig: StateConfig, taxableIncome: number, filingStatus: string) {
    const brackets = stateConfig.brackets?.[filingStatus as keyof typeof stateConfig.brackets] || stateConfig.brackets?.single || [];
    let totalTax = 0;
    let marginalRate = 0;
    const breakdown: any[] = [];

    if (stateConfig.type === 'FLAT') {
      const rate = brackets[0]?.rate || 0;
      const exemptAmount = brackets[0]?.min || 0;
      const taxableAmount = Math.max(0, taxableIncome - exemptAmount);
      totalTax = taxableAmount * rate;
      marginalRate = rate;
    
      if (taxableAmount > 0) {
        breakdown.push({
          bracket: `${(rate * 100).toFixed(2)}% on income over $${exemptAmount.toLocaleString()}`,
          taxableAmount,
          rate,
          tax: totalTax
        });
      }
    } else {
      // Progressive brackets
      let remainingIncome = taxableIncome;
    
      for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const nextBracket = brackets[i + 1];
        
        let bracketMax = nextBracket ? nextBracket.min : Infinity;
        let bracketIncome = Math.min(remainingIncome, bracketMax - bracket.min);
        
        if (bracketIncome > 0) {
          const bracketTax = bracketIncome * bracket.rate;
          totalTax += bracketTax;
          marginalRate = bracket.rate;
          
          breakdown.push({
            bracket: `${(bracket.rate * 100).toFixed(2)}% on income $${bracket.min.toLocaleString()} - ${nextBracket ? `$${(nextBracket.min - 1).toLocaleString()}` : 'above'}`,
            taxableAmount: bracketIncome,
            rate: bracket.rate,
            tax: bracketTax
          });
        }
        
        remainingIncome -= bracketIncome;
        if (remainingIncome <= 0) break;
      }
    }

    return {
      totalTax,
      marginalRate,
      breakdown,
      standardDeduction: this.getStandardDeduction(stateConfig, filingStatus),
      personalExemption: this.getPersonalExemption(stateConfig, filingStatus)
    };
  }

  private applyCredits(stateConfig: StateConfig, taxCalculation: any, taxData: any) {
    let totalTax = taxCalculation.totalTax;
    const credits: Array<{ name: string; amount: number }> = [];

    if (stateConfig.credits) {
      for (const creditConfig of stateConfig.credits) {
        const creditAmount = this.calculateCredit(creditConfig, taxData);
        if (creditAmount > 0) {
          credits.push({
            name: creditConfig.name,
            amount: creditAmount
          });
          totalTax -= creditAmount;
        }
      }
    }

    return {
      totalTax: Math.max(0, totalTax),
      credits
    };
  }

  private getStandardDeduction(stateConfig: StateConfig, filingStatus: string, age = 0, isBlind = false, spouseAge = 0, spouseIsBlind = false): number {
    let standardDeduction = 0;

    if (stateConfig.standardDeduction) {
      if (typeof stateConfig.standardDeduction === 'number') {
        standardDeduction = stateConfig.standardDeduction;
      } else if (stateConfig.standardDeduction[filingStatus as keyof typeof stateConfig.standardDeduction]) {
        standardDeduction = stateConfig.standardDeduction[filingStatus as keyof typeof stateConfig.standardDeduction];
      } else {
        standardDeduction = stateConfig.standardDeduction.single || 0;
      }

      // Additional deductions for age/blindness (if applicable)
      if (stateConfig.additionalDeductionFor65Plus && age >= 65) {
        standardDeduction += stateConfig.additionalDeductionFor65Plus;
      }
      if (stateConfig.additionalDeductionForBlind && isBlind) {
        standardDeduction += stateConfig.additionalDeductionForBlind;
      }
      if (filingStatus === 'marriedFilingJointly' && spouseAge >= 65 && stateConfig.additionalDeductionFor65Plus) {
        standardDeduction += stateConfig.additionalDeductionFor65Plus;
      }
      if (filingStatus === 'marriedFilingJointly' && spouseIsBlind && stateConfig.additionalDeductionForBlind) {
        standardDeduction += stateConfig.additionalDeductionForBlind;
      }
    }

    return standardDeduction;
  }

  private getPersonalExemption(stateConfig: StateConfig, filingStatus: string, dependents = 0, income = 0): number {
    let totalExemption = 0;

    if (stateConfig.personalExemption) {
      const exemptionConfig = stateConfig.personalExemption;
    
      // Taxpayer exemption
      if (exemptionConfig.taxpayer) {
        totalExemption += exemptionConfig.taxpayer;
      }
    
      // Spouse exemption
      if (filingStatus === 'marriedFilingJointly' && exemptionConfig.spouse) {
        totalExemption += exemptionConfig.spouse;
      }
    
      // Dependent exemption
      if (dependents > 0 && exemptionConfig.dependent) {
        totalExemption += exemptionConfig.dependent * dependents;
      }

      // Apply phase-out if applicable
      if (exemptionConfig.phaseOut && income > exemptionConfig.phaseOut.startIncome) {
        const excessIncome = income - exemptionConfig.phaseOut.startIncome;
        const reduction = Math.min(totalExemption, excessIncome * exemptionConfig.phaseOut.rate);
        totalExemption -= reduction;
      }
    }

    return Math.max(0, totalExemption);
  }

  private calculateSpecialTax(stateConfig: StateConfig, taxData: any): StateTaxResult {
    const { income, dividends = 0, interest = 0, capitalGains = 0 } = taxData;
    let taxableAmount = 0;
    let taxType = '';

    if (stateConfig.specialTaxType === 'DIVIDENDS_INTEREST') {
      taxableAmount = dividends + interest;
      taxType = 'Dividends & Interest Tax';
    } else if (stateConfig.specialTaxType === 'CAPITAL_GAINS') {
      taxableAmount = capitalGains;
      taxType = 'Capital Gains Tax';
    }

    const exemption = stateConfig.exemption || 0;
    const taxableAfterExemption = Math.max(0, taxableAmount - exemption);
    const tax = taxableAfterExemption * (stateConfig.rate || 0);

    return {
      state: stateConfig.state,
      stateName: stateConfig.name,
      taxType,
      stateTax: tax,
      effectiveRate: taxableAmount > 0 ? (tax / taxableAmount) * 100 : 0,
      marginalRate: (stateConfig.rate || 0) * 100,
      taxableIncome: taxableAfterExemption,
      credits: [],
      breakdown: taxableAfterExemption > 0 ? [{
        bracket: `${((stateConfig.rate || 0) * 100).toFixed(2)}% on ${taxType.toLowerCase()} over $${exemption.toLocaleString()}`,
        taxableAmount: taxableAfterExemption,
        rate: stateConfig.rate || 0,
        tax
      }] : [],
      notes: stateConfig.notes || []
    };
  }

  private calculateCredit(creditConfig: any, taxData: any): number {
    const { filingStatus, dependents, income, dependentsUnder17 = 0, dependentsOver17 = 0 } = taxData;
    let creditAmount = 0;

    switch (creditConfig.condition) {
      case 'dependent':
        creditAmount = creditConfig.amount * dependents;
        break;
      case 'dependentUnder17':
        creditAmount = creditConfig.amount * dependentsUnder17;
        break;
      case 'dependentOver17':
        creditAmount = creditConfig.amount * dependentsOver17;
        break;
      default:
        if (creditConfig.filingStatus === filingStatus) {
          creditAmount = creditConfig.amount;
        } else if (!creditConfig.filingStatus) {
          creditAmount = creditConfig.amount;
        }
        break;
    }

    // Apply income phase-outs if specified
    if (creditConfig.phaseOut && income > creditConfig.phaseOut.startIncome) {
      const excessIncome = income - creditConfig.phaseOut.startIncome;
      const reduction = excessIncome * creditConfig.phaseOut.rate;
      creditAmount = Math.max(0, creditAmount - reduction);
    }

    return creditAmount;
  }

  /**
   * Initialize all state tax configurations for 2025 (updated from 2024)
   */
  private initializeStateConfigs2025(): Record<string, StateConfig> {
    return {
      // NO TAX STATES
      AK: { state: 'AK', name: 'Alaska', type: 'NO_TAX' },
      FL: { state: 'FL', name: 'Florida', type: 'NO_TAX' },
      NV: { state: 'NV', name: 'Nevada', type: 'NO_TAX' },
      SD: { state: 'SD', name: 'South Dakota', type: 'NO_TAX' },
      TN: { state: 'TN', name: 'Tennessee', type: 'NO_TAX' },
      TX: { state: 'TX', name: 'Texas', type: 'NO_TAX' },
      WY: { state: 'WY', name: 'Wyoming', type: 'NO_TAX' },

      // SPECIAL TAX STATES
      NH: {
        state: 'NH',
        name: 'New Hampshire',
        type: 'NO_TAX', // Changed for 2025 - NH eliminated D&I tax
        notes: ['New Hampshire eliminated the dividends and interest tax in 2025']
      },
      WA: {
        state: 'WA',
        name: 'Washington',
        type: 'SPECIAL',
        specialTaxType: 'CAPITAL_GAINS',
        rate: 0.07,
        exemption: 262500, // Adjusted for inflation
        notes: ['Only taxes capital gains income over $262,500 (2025)']
      },

      // FLAT TAX STATES (2025 rates)
      AZ: {
        state: 'AZ',
        name: 'Arizona',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.025 }],
          marriedFilingJointly: [{ min: 0, rate: 0.025 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.025 }],
          headOfHousehold: [{ min: 0, rate: 0.025 }]
        },
        standardDeduction: {
          single: 15000,
          marriedFilingJointly: 30000,
          marriedFilingSeparately: 15000,
          headOfHousehold: 22500
        },
        usesFederalAGI: true,
        credits: [
          { name: 'Dependent Credit (Under 17)', amount: 100, condition: 'dependentUnder17' },
          { name: 'Dependent Credit (17 and Over)', amount: 25, condition: 'dependentOver17' }
        ]
      },

      CO: {
        state: 'CO',
        name: 'Colorado',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.044 }],
          marriedFilingJointly: [{ min: 0, rate: 0.044 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.044 }],
          headOfHousehold: [{ min: 0, rate: 0.044 }]
        },
        standardDeduction: {
          single: 15000,
          marriedFilingJointly: 30000,
          marriedFilingSeparately: 15000,
          headOfHousehold: 22500
        },
        usesFederalAGI: true
      },

      GA: {
        state: 'GA',
        name: 'Georgia',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0549 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0549 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0549 }],
          headOfHousehold: [{ min: 0, rate: 0.0549 }]
        },
        standardDeduction: {
          single: 12400,
          marriedFilingJointly: 24800,
          marriedFilingSeparately: 12400,
          headOfHousehold: 18600
        },
        personalExemption: {
          taxpayer: 3100,
          spouse: 3100,
          dependent: 3100
        }
      },

      IL: {
        state: 'IL',
        name: 'Illinois',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0495 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0495 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0495 }],
          headOfHousehold: [{ min: 0, rate: 0.0495 }]
        },
        personalExemption: {
          taxpayer: 2850,
          spouse: 2850,
          dependent: 2850
        }
      },

      IN: {
        state: 'IN',
        name: 'Indiana',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0305 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0305 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0305 }],
          headOfHousehold: [{ min: 0, rate: 0.0305 }]
        },
        personalExemption: {
          taxpayer: 1000,
          spouse: 1000,
          dependent: 1000
        }
      },

      MI: {
        state: 'MI',
        name: 'Michigan',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0425 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0425 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0425 }],
          headOfHousehold: [{ min: 0, rate: 0.0425 }]
        },
        personalExemption: {
          taxpayer: 5800,
          spouse: 5800,
          dependent: 5800
        }
      },

      NC: {
        state: 'NC',
        name: 'North Carolina',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.045 }],
          marriedFilingJointly: [{ min: 0, rate: 0.045 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.045 }],
          headOfHousehold: [{ min: 0, rate: 0.045 }]
        },
        standardDeduction: {
          single: 13150,
          marriedFilingJointly: 26300,
          marriedFilingSeparately: 13150,
          headOfHousehold: 19725
        }
      },

      PA: {
        state: 'PA',
        name: 'Pennsylvania',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0307 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0307 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0307 }],
          headOfHousehold: [{ min: 0, rate: 0.0307 }]
        }
      },

      // PROGRESSIVE TAX STATES (2025 updated brackets)
      CA: {
        state: 'CA',
        name: 'California',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.01 },
            { min: 10750, rate: 0.02 },
            { min: 25500, rate: 0.04 },
            { min: 40250, rate: 0.06 },
            { min: 55850, rate: 0.08 },
            { min: 70650, rate: 0.093 },
            { min: 361000, rate: 0.103 },
            { min: 433350, rate: 0.113 },
            { min: 722000, rate: 0.123 },
            { min: 1000000, rate: 0.133 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.01 },
            { min: 21500, rate: 0.02 },
            { min: 51000, rate: 0.04 },
            { min: 80500, rate: 0.06 },
            { min: 111700, rate: 0.08 },
            { min: 141300, rate: 0.093 },
            { min: 722000, rate: 0.103 },
            { min: 866700, rate: 0.113 },
            { min: 1000000, rate: 0.123 },
            { min: 1444000, rate: 0.133 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.01 },
            { min: 10750, rate: 0.02 },
            { min: 25500, rate: 0.04 },
            { min: 40250, rate: 0.06 },
            { min: 55850, rate: 0.08 },
            { min: 70650, rate: 0.093 },
            { min: 361000, rate: 0.103 },
            { min: 433350, rate: 0.113 },
            { min: 500000, rate: 0.123 },
            { min: 722000, rate: 0.133 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.01 },
            { min: 21500, rate: 0.02 },
            { min: 51000, rate: 0.04 },
            { min: 66250, rate: 0.06 },
            { min: 82650, rate: 0.08 },
            { min: 97350, rate: 0.093 },
            { min: 722000, rate: 0.103 },
            { min: 866700, rate: 0.113 },
            { min: 1000000, rate: 0.123 },
            { min: 1444000, rate: 0.133 }
          ]
        },
        standardDeduction: {
          single: 5540,
          marriedFilingJointly: 11080,
          marriedFilingSeparately: 5540,
          headOfHousehold: 8335
        },
        personalExemption: {
          taxpayer: 158,
          spouse: 158,
          dependent: 486
        },
        notes: ['Additional 1.1% payroll tax on wages brings effective top rate to 14.4%']
      },

      NY: {
        state: 'NY',
        name: 'New York',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.04 },
            { min: 8800, rate: 0.045 },
            { min: 12100, rate: 0.0525 },
            { min: 14350, rate: 0.055 },
            { min: 83350, rate: 0.06 },
            { min: 222700, rate: 0.0685 },
            { min: 1115550, rate: 0.0965 },
            { min: 5000000, rate: 0.103 },
            { min: 25000000, rate: 0.109 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.04 },
            { min: 17700, rate: 0.045 },
            { min: 24400, rate: 0.0525 },
            { min: 28900, rate: 0.055 },
            { min: 167050, rate: 0.06 },
            { min: 334050, rate: 0.0685 },
            { min: 2231100, rate: 0.0965 },
            { min: 5000000, rate: 0.103 },
            { min: 25000000, rate: 0.109 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.04 },
            { min: 8800, rate: 0.045 },
            { min: 12100, rate: 0.0525 },
            { min: 14350, rate: 0.055 },
            { min: 83350, rate: 0.06 },
            { min: 167025, rate: 0.0685 },
            { min: 1115550, rate: 0.0965 },
            { min: 5000000, rate: 0.103 },
            { min: 25000000, rate: 0.109 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.04 },
            { min: 12900, rate: 0.045 },
            { min: 16200, rate: 0.0525 },
            { min: 18550, rate: 0.055 },
            { min: 125200, rate: 0.06 },
            { min: 223150, rate: 0.0685 },
            { min: 1115550, rate: 0.0965 },
            { min: 5000000, rate: 0.103 },
            { min: 25000000, rate: 0.109 }
          ]
        },
        standardDeduction: {
          single: 8300,
          marriedFilingJointly: 16650,
          marriedFilingSeparately: 8300,
          headOfHousehold: 11600
        },
        personalExemption: {
          taxpayer: 0,
          spouse: 0,
          dependent: 1000
        }
      },

      NJ: {
        state: 'NJ',
        name: 'New Jersey',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.014 },
            { min: 20650, rate: 0.0175 },
            { min: 36200, rate: 0.035 },
            { min: 41350, rate: 0.05525 },
            { min: 77550, rate: 0.06370 },
            { min: 517500, rate: 0.08970 },
            { min: 1035000, rate: 0.1075 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.014 },
            { min: 20650, rate: 0.0175 },
            { min: 51700, rate: 0.0245 },
            { min: 72400, rate: 0.035 },
            { min: 82700, rate: 0.05525 },
            { min: 155100, rate: 0.06370 },
            { min: 517500, rate: 0.08970 },
            { min: 1035000, rate: 0.1075 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.014 },
            { min: 20650, rate: 0.0175 },
            { min: 25850, rate: 0.0245 },
            { min: 36200, rate: 0.035 },
            { min: 41350, rate: 0.05525 },
            { min: 77550, rate: 0.06370 },
            { min: 258750, rate: 0.08970 },
            { min: 517500, rate: 0.1075 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.014 },
            { min: 20650, rate: 0.0175 },
            { min: 51700, rate: 0.0245 },
            { min: 72400, rate: 0.035 },
            { min: 82700, rate: 0.05525 },
            { min: 155100, rate: 0.06370 },
            { min: 517500, rate: 0.08970 },
            { min: 1035000, rate: 0.1075 }
          ]
        },
        personalExemption: {
          taxpayer: 1000,
          spouse: 1000,
          dependent: 1550
        }
      },

      // Add more common states to prevent "unsupported" issues
      OH: {
        state: 'OH',
        name: 'Ohio',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0 },
            { min: 26050, rate: 0.02765 },
            { min: 46100, rate: 0.03226 },
            { min: 92200, rate: 0.03688 },
            { min: 115250, rate: 0.04413 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0 },
            { min: 26050, rate: 0.02765 },
            { min: 46100, rate: 0.03226 },
            { min: 92200, rate: 0.03688 },
            { min: 115250, rate: 0.04413 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0 },
            { min: 26050, rate: 0.02765 },
            { min: 46100, rate: 0.03226 },
            { min: 92200, rate: 0.03688 },
            { min: 115250, rate: 0.04413 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0 },
            { min: 26050, rate: 0.02765 },
            { min: 46100, rate: 0.03226 },
            { min: 92200, rate: 0.03688 },
            { min: 115250, rate: 0.04413 }
          ]
        }
      },

      VA: {
        state: 'VA',
        name: 'Virginia',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.02 },
            { min: 3000, rate: 0.03 },
            { min: 5000, rate: 0.05 },
            { min: 17000, rate: 0.0575 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.02 },
            { min: 3000, rate: 0.03 },
            { min: 5000, rate: 0.05 },
            { min: 17000, rate: 0.0575 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.02 },
            { min: 3000, rate: 0.03 },
            { min: 5000, rate: 0.05 },
            { min: 17000, rate: 0.0575 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.02 },
            { min: 3000, rate: 0.03 },
            { min: 5000, rate: 0.05 },
            { min: 17000, rate: 0.0575 }
          ]
        },
        standardDeduction: {
          single: 4500,
          marriedFilingJointly: 9000,
          marriedFilingSeparately: 4500,
          headOfHousehold: 6750
        },
        personalExemption: {
          taxpayer: 930,
          spouse: 930,
          dependent: 930
        }
      },

      OR: {
        state: 'OR',
        name: 'Oregon',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0475 },
            { min: 4050, rate: 0.0675 },
            { min: 10200, rate: 0.0875 },
            { min: 25500, rate: 0.099 },
            { min: 63900, rate: 0.1125 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0475 },
            { min: 8100, rate: 0.0675 },
            { min: 20400, rate: 0.0875 },
            { min: 51000, rate: 0.099 },
            { min: 127800, rate: 0.1125 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0475 },
            { min: 4050, rate: 0.0675 },
            { min: 10200, rate: 0.0875 },
            { min: 25500, rate: 0.099 },
            { min: 63900, rate: 0.1125 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0475 },
            { min: 6500, rate: 0.0675 },
            { min: 16300, rate: 0.0875 },
            { min: 40800, rate: 0.099 },
            { min: 102200, rate: 0.1125 }
          ]
        },
        standardDeduction: {
          single: 2745,
          marriedFilingJointly: 5490,
          marriedFilingSeparately: 2745,
          headOfHousehold: 4120
        }
      },

      MN: {
        state: 'MN',
        name: 'Minnesota',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0535 },
            { min: 31690, rate: 0.0685 },
            { min: 103900, rate: 0.0785 },
            { min: 195430, rate: 0.0985 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0535 },
            { min: 47580, rate: 0.0685 },
            { min: 190320, rate: 0.0785 },
            { min: 284810, rate: 0.0985 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0535 },
            { min: 23790, rate: 0.0685 },
            { min: 95160, rate: 0.0785 },
            { min: 142405, rate: 0.0985 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0535 },
            { min: 39520, rate: 0.0685 },
            { min: 147110, rate: 0.0785 },
            { min: 240120, rate: 0.0985 }
          ]
        },
        standardDeduction: {
          single: 14850,
          marriedFilingJointly: 29700,
          marriedFilingSeparately: 14850,
          headOfHousehold: 22275
        }
      },

      WI: {
        state: 'WI',
        name: 'Wisconsin',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0354 },
            { min: 13810, rate: 0.0465 },
            { min: 27630, rate: 0.0627 },
            { min: 304170, rate: 0.0765 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0354 },
            { min: 18420, rate: 0.0465 },
            { min: 36840, rate: 0.0627 },
            { min: 405560, rate: 0.0765 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0354 },
            { min: 9210, rate: 0.0465 },
            { min: 18420, rate: 0.0627 },
            { min: 202780, rate: 0.0765 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0354 },
            { min: 16110, rate: 0.0465 },
            { min: 32240, rate: 0.0627 },
            { min: 354860, rate: 0.0765 }
          ]
        },
        standardDeduction: {
          single: 14180,
          marriedFilingJointly: 26270,
          marriedFilingSeparately: 13135,
          headOfHousehold: 20870
        }
      },

      MA: {
        state: 'MA',
        name: 'Massachusetts',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.05 }],
          marriedFilingJointly: [{ min: 0, rate: 0.05 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.05 }],
          headOfHousehold: [{ min: 0, rate: 0.05 }]
        },
        personalExemption: {
          taxpayer: 4400,
          spouse: 4400,
          dependent: 1000
        }
      },

      MD: {
        state: 'MD',
        name: 'Maryland',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.02 },
            { min: 1000, rate: 0.03 },
            { min: 2000, rate: 0.04 },
            { min: 3000, rate: 0.0475 },
            { min: 100000, rate: 0.05 },
            { min: 125000, rate: 0.0525 },
            { min: 150000, rate: 0.055 },
            { min: 250000, rate: 0.0575 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.02 },
            { min: 1000, rate: 0.03 },
            { min: 2000, rate: 0.04 },
            { min: 3000, rate: 0.0475 },
            { min: 150000, rate: 0.05 },
            { min: 175000, rate: 0.0525 },
            { min: 225000, rate: 0.055 },
            { min: 300000, rate: 0.0575 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.02 },
            { min: 1000, rate: 0.03 },
            { min: 2000, rate: 0.04 },
            { min: 3000, rate: 0.0475 },
            { min: 100000, rate: 0.05 },
            { min: 125000, rate: 0.0525 },
            { min: 150000, rate: 0.055 },
            { min: 250000, rate: 0.0575 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.02 },
            { min: 1000, rate: 0.03 },
            { min: 2000, rate: 0.04 },
            { min: 3000, rate: 0.0475 },
            { min: 150000, rate: 0.05 },
            { min: 175000, rate: 0.0525 },
            { min: 225000, rate: 0.055 },
            { min: 300000, rate: 0.0575 }
          ]
        },
        standardDeduction: {
          single: 2600,
          marriedFilingJointly: 5200,
          marriedFilingSeparately: 2600,
          headOfHousehold: 3900
        },
        personalExemption: {
          taxpayer: 3700,
          spouse: 3700,
          dependent: 3700
        }
      },

      SC: {
        state: 'SC',
        name: 'South Carolina',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0 },
            { min: 3460, rate: 0.03 },
            { min: 6920, rate: 0.04 },
            { min: 10380, rate: 0.05 },
            { min: 13840, rate: 0.06 },
            { min: 17300, rate: 0.07 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0 },
            { min: 6920, rate: 0.03 },
            { min: 13840, rate: 0.04 },
            { min: 20760, rate: 0.05 },
            { min: 27680, rate: 0.06 },
            { min: 34600, rate: 0.07 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0 },
            { min: 3460, rate: 0.03 },
            { min: 6920, rate: 0.04 },
            { min: 10380, rate: 0.05 },
            { min: 13840, rate: 0.06 },
            { min: 17300, rate: 0.07 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0 },
            { min: 5200, rate: 0.03 },
            { min: 10380, rate: 0.04 },
            { min: 15570, rate: 0.05 },
            { min: 20760, rate: 0.06 },
            { min: 25950, rate: 0.07 }
          ]
        },
        standardDeduction: {
          single: 12950,
          marriedFilingJointly: 25900,
          marriedFilingSeparately: 12950,
          headOfHousehold: 19425
        }
      },

      // UTAH - PROGRESSIVE TAX STATE
      UT: {
        state: 'UT',
        name: 'Utah',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0495 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0495 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0495 }],
          headOfHousehold: [{ min: 0, rate: 0.0495 }]
        },
        standardDeduction: {
          single: 15000,
          marriedFilingJointly: 30000,
          marriedFilingSeparately: 15000,
          headOfHousehold: 22500
        },
        personalExemption: {
          taxpayer: 0,
          spouse: 0,
          dependent: 0
        },
        usesFederalAGI: true,
        allowsItemization: true,
        notes: ['Utah has a flat 4.95% income tax rate for 2025']
      },

      // ALABAMA - PROGRESSIVE TAX STATE
      AL: {
        state: 'AL',
        name: 'Alabama',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.02 },
            { min: 500, rate: 0.04 },
            { min: 3000, rate: 0.05 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.02 },
            { min: 1000, rate: 0.04 },
            { min: 6000, rate: 0.05 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.02 },
            { min: 500, rate: 0.04 },
            { min: 3000, rate: 0.05 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.02 },
            { min: 750, rate: 0.04 },
            { min: 4500, rate: 0.05 }
          ]
        },
        standardDeduction: {
          single: 2500,
          marriedFilingJointly: 7500,
          marriedFilingSeparately: 2500,
          headOfHousehold: 4700
        },
        personalExemption: {
          taxpayer: 1500,
          spouse: 1500,
          dependent: 300
        }
      },

      // ARKANSAS - PROGRESSIVE TAX STATE
      AR: {
        state: 'AR',
        name: 'Arkansas',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.02 },
            { min: 4900, rate: 0.04 },
            { min: 9800, rate: 0.0475 },
            { min: 14600, rate: 0.0525 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.02 },
            { min: 4900, rate: 0.04 },
            { min: 9800, rate: 0.0475 },
            { min: 14600, rate: 0.0525 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.02 },
            { min: 4900, rate: 0.04 },
            { min: 9800, rate: 0.0475 },
            { min: 14600, rate: 0.0525 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.02 },
            { min: 4900, rate: 0.04 },
            { min: 9800, rate: 0.0475 },
            { min: 14600, rate: 0.0525 }
          ]
        },
        standardDeduction: {
          single: 2340,
          marriedFilingJointly: 4680,
          marriedFilingSeparately: 2340,
          headOfHousehold: 3510
        },
        personalExemption: {
          taxpayer: 29,
          spouse: 29,
          dependent: 29
        }
      },

      // CONNECTICUT - PROGRESSIVE TAX STATE
      CT: {
        state: 'CT',
        name: 'Connecticut',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.05 },
            { min: 50000, rate: 0.055 },
            { min: 100000, rate: 0.06 },
            { min: 200000, rate: 0.065 },
            { min: 250000, rate: 0.069 },
            { min: 500000, rate: 0.0699 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.03 },
            { min: 20000, rate: 0.05 },
            { min: 100000, rate: 0.055 },
            { min: 200000, rate: 0.06 },
            { min: 400000, rate: 0.065 },
            { min: 500000, rate: 0.069 },
            { min: 1000000, rate: 0.0699 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.05 },
            { min: 50000, rate: 0.055 },
            { min: 100000, rate: 0.06 },
            { min: 200000, rate: 0.065 },
            { min: 250000, rate: 0.069 },
            { min: 500000, rate: 0.0699 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.03 },
            { min: 16000, rate: 0.05 },
            { min: 80000, rate: 0.055 },
            { min: 160000, rate: 0.06 },
            { min: 320000, rate: 0.065 },
            { min: 400000, rate: 0.069 },
            { min: 800000, rate: 0.0699 }
          ]
        },
        standardDeduction: {
          single: 15000,
          marriedFilingJointly: 30000,
          marriedFilingSeparately: 15000,
          headOfHousehold: 22500
        },
        personalExemption: {
          taxpayer: 15000,
          spouse: 15000,
          dependent: 0
        }
      },

      // DELAWARE - PROGRESSIVE TAX STATE
      DE: {
        state: 'DE',
        name: 'Delaware',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0 },
            { min: 2000, rate: 0.022 },
            { min: 5000, rate: 0.039 },
            { min: 10000, rate: 0.048 },
            { min: 20000, rate: 0.052 },
            { min: 25000, rate: 0.0555 },
            { min: 60000, rate: 0.066 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0 },
            { min: 2000, rate: 0.022 },
            { min: 5000, rate: 0.039 },
            { min: 10000, rate: 0.048 },
            { min: 20000, rate: 0.052 },
            { min: 25000, rate: 0.0555 },
            { min: 60000, rate: 0.066 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0 },
            { min: 2000, rate: 0.022 },
            { min: 5000, rate: 0.039 },
            { min: 10000, rate: 0.048 },
            { min: 20000, rate: 0.052 },
            { min: 25000, rate: 0.0555 },
            { min: 60000, rate: 0.066 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0 },
            { min: 2000, rate: 0.022 },
            { min: 5000, rate: 0.039 },
            { min: 10000, rate: 0.048 },
            { min: 20000, rate: 0.052 },
            { min: 25000, rate: 0.0555 },
            { min: 60000, rate: 0.066 }
          ]
        },
        standardDeduction: {
          single: 3250,
          marriedFilingJointly: 6500,
          marriedFilingSeparately: 3250,
          headOfHousehold: 4875
        },
        personalExemption: {
          taxpayer: 110,
          spouse: 110,
          dependent: 110
        }
      },

      // HAWAII - PROGRESSIVE TAX STATE
      HI: {
        state: 'HI',
        name: 'Hawaii',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.014 },
            { min: 2400, rate: 0.032 },
            { min: 4800, rate: 0.055 },
            { min: 9600, rate: 0.064 },
            { min: 14400, rate: 0.068 },
            { min: 19200, rate: 0.072 },
            { min: 24000, rate: 0.076 },
            { min: 36000, rate: 0.079 },
            { min: 48000, rate: 0.0825 },
            { min: 150000, rate: 0.09 },
            { min: 175000, rate: 0.10 },
            { min: 200000, rate: 0.11 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.014 },
            { min: 4800, rate: 0.032 },
            { min: 9600, rate: 0.055 },
            { min: 19200, rate: 0.064 },
            { min: 28800, rate: 0.068 },
            { min: 38400, rate: 0.072 },
            { min: 48000, rate: 0.076 },
            { min: 72000, rate: 0.079 },
            { min: 96000, rate: 0.0825 },
            { min: 300000, rate: 0.09 },
            { min: 350000, rate: 0.10 },
            { min: 400000, rate: 0.11 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.014 },
            { min: 2400, rate: 0.032 },
            { min: 4800, rate: 0.055 },
            { min: 9600, rate: 0.064 },
            { min: 14400, rate: 0.068 },
            { min: 19200, rate: 0.072 },
            { min: 24000, rate: 0.076 },
            { min: 36000, rate: 0.079 },
            { min: 48000, rate: 0.0825 },
            { min: 150000, rate: 0.09 },
            { min: 175000, rate: 0.10 },
            { min: 200000, rate: 0.11 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.014 },
            { min: 3600, rate: 0.032 },
            { min: 7200, rate: 0.055 },
            { min: 14400, rate: 0.064 },
            { min: 21600, rate: 0.068 },
            { min: 28800, rate: 0.072 },
            { min: 36000, rate: 0.076 },
            { min: 54000, rate: 0.079 },
            { min: 72000, rate: 0.0825 },
            { min: 225000, rate: 0.09 },
            { min: 262500, rate: 0.10 },
            { min: 300000, rate: 0.11 }
          ]
        },
        standardDeduction: {
          single: 2200,
          marriedFilingJointly: 4400,
          marriedFilingSeparately: 2200,
          headOfHousehold: 3212
        },
        personalExemption: {
          taxpayer: 1144,
          spouse: 1144,
          dependent: 1144
        }
      },

      // IDAHO - PROGRESSIVE TAX STATE
      ID: {
        state: 'ID',
        name: 'Idaho',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.01 },
            { min: 1700, rate: 0.03 },
            { min: 3400, rate: 0.045 },
            { min: 5100, rate: 0.06 },
            { min: 6800, rate: 0.0675 },
            { min: 8500, rate: 0.069 },
            { min: 12750, rate: 0.0695 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.01 },
            { min: 3400, rate: 0.03 },
            { min: 6800, rate: 0.045 },
            { min: 10200, rate: 0.06 },
            { min: 13600, rate: 0.0675 },
            { min: 17000, rate: 0.069 },
            { min: 25500, rate: 0.0695 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.01 },
            { min: 1700, rate: 0.03 },
            { min: 3400, rate: 0.045 },
            { min: 5100, rate: 0.06 },
            { min: 6800, rate: 0.0675 },
            { min: 8500, rate: 0.069 },
            { min: 12750, rate: 0.0695 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.01 },
            { min: 2550, rate: 0.03 },
            { min: 5100, rate: 0.045 },
            { min: 7650, rate: 0.06 },
            { min: 10200, rate: 0.0675 },
            { min: 12750, rate: 0.069 },
            { min: 19125, rate: 0.0695 }
          ]
        },
        standardDeduction: {
          single: 14600,
          marriedFilingJointly: 29200,
          marriedFilingSeparately: 14600,
          headOfHousehold: 21900
        }
      },

      // IOWA - PROGRESSIVE TAX STATE
      IA: {
        state: 'IA',
        name: 'Iowa',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.0367 }],
          marriedFilingJointly: [{ min: 0, rate: 0.0367 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.0367 }],
          headOfHousehold: [{ min: 0, rate: 0.0367 }]
        },
        standardDeduction: {
          single: 2450,
          marriedFilingJointly: 6050,
          marriedFilingSeparately: 3025,
          headOfHousehold: 4550
        },
        personalExemption: {
          taxpayer: 40,
          spouse: 40,
          dependent: 40
        },
        notes: ['Iowa transitioned to a flat tax rate of 3.67% in 2025']
      },

      // KANSAS - PROGRESSIVE TAX STATE
      KS: {
        state: 'KS',
        name: 'Kansas',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.031 },
            { min: 15000, rate: 0.0525 },
            { min: 30000, rate: 0.057 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.031 },
            { min: 30000, rate: 0.0525 },
            { min: 60000, rate: 0.057 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.031 },
            { min: 15000, rate: 0.0525 },
            { min: 30000, rate: 0.057 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.031 },
            { min: 22500, rate: 0.0525 },
            { min: 45000, rate: 0.057 }
          ]
        },
        standardDeduction: {
          single: 3500,
          marriedFilingJointly: 8750,
          marriedFilingSeparately: 4375,
          headOfHousehold: 6250
        },
        personalExemption: {
          taxpayer: 2250,
          spouse: 2250,
          dependent: 2250
        }
      },

      // KENTUCKY - FLAT TAX STATE
      KY: {
        state: 'KY',
        name: 'Kentucky',
        type: 'FLAT',
        brackets: {
          single: [{ min: 0, rate: 0.04 }],
          marriedFilingJointly: [{ min: 0, rate: 0.04 }],
          marriedFilingSeparately: [{ min: 0, rate: 0.04 }],
          headOfHousehold: [{ min: 0, rate: 0.04 }]
        },
        standardDeduction: {
          single: 2970,
          marriedFilingJointly: 5940,
          marriedFilingSeparately: 2970,
          headOfHousehold: 4455
        }
      },

      // LOUISIANA - PROGRESSIVE TAX STATE
      LA: {
        state: 'LA',
        name: 'Louisiana',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0185 },
            { min: 12500, rate: 0.035 },
            { min: 50000, rate: 0.0425 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0185 },
            { min: 25000, rate: 0.035 },
            { min: 100000, rate: 0.0425 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0185 },
            { min: 12500, rate: 0.035 },
            { min: 50000, rate: 0.0425 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0185 },
            { min: 18750, rate: 0.035 },
            { min: 75000, rate: 0.0425 }
          ]
        },
        standardDeduction: {
          single: 4500,
          marriedFilingJointly: 9000,
          marriedFilingSeparately: 4500,
          headOfHousehold: 6750
        },
        personalExemption: {
          taxpayer: 4500,
          spouse: 4500,
          dependent: 1000
        }
      },

      // MAINE - PROGRESSIVE TAX STATE
      ME: {
        state: 'ME',
        name: 'Maine',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.058 },
            { min: 25050, rate: 0.0675 },
            { min: 59600, rate: 0.0715 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.058 },
            { min: 50100, rate: 0.0675 },
            { min: 119200, rate: 0.0715 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.058 },
            { min: 25050, rate: 0.0675 },
            { min: 59600, rate: 0.0715 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.058 },
            { min: 37575, rate: 0.0675 },
            { min: 89400, rate: 0.0715 }
          ]
        },
        standardDeduction: {
          single: 14850,
          marriedFilingJointly: 29700,
          marriedFilingSeparately: 14850,
          headOfHousehold: 22275
        },
        personalExemption: {
          taxpayer: 5000,
          spouse: 5000,
          dependent: 5000
        }
      },

      // MISSISSIPPI - PROGRESSIVE TAX STATE
      MS: {
        state: 'MS',
        name: 'Mississippi',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0 },
            { min: 5000, rate: 0.04 },
            { min: 10000, rate: 0.05 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0 },
            { min: 5000, rate: 0.04 },
            { min: 10000, rate: 0.05 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0 },
            { min: 5000, rate: 0.04 },
            { min: 10000, rate: 0.05 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0 },
            { min: 5000, rate: 0.04 },
            { min: 10000, rate: 0.05 }
          ]
        },
        standardDeduction: {
          single: 2300,
          marriedFilingJointly: 4600,
          marriedFilingSeparately: 2300,
          headOfHousehold: 3400
        },
        personalExemption: {
          taxpayer: 6000,
          spouse: 6000,
          dependent: 1500
        }
      },

      // MISSOURI - PROGRESSIVE TAX STATE
      MO: {
        state: 'MO',
        name: 'Missouri',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.015 },
            { min: 1141, rate: 0.02 },
            { min: 2281, rate: 0.025 },
            { min: 3422, rate: 0.03 },
            { min: 4563, rate: 0.035 },
            { min: 5704, rate: 0.04 },
            { min: 6845, rate: 0.045 },
            { min: 7986, rate: 0.05 },
            { min: 9127, rate: 0.0525 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.015 },
            { min: 2281, rate: 0.02 },
            { min: 4562, rate: 0.025 },
            { min: 6843, rate: 0.03 },
            { min: 9124, rate: 0.035 },
            { min: 11405, rate: 0.04 },
            { min: 13686, rate: 0.045 },
            { min: 15967, rate: 0.05 },
            { min: 18248, rate: 0.0525 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.015 },
            { min: 1141, rate: 0.02 },
            { min: 2281, rate: 0.025 },
            { min: 3422, rate: 0.03 },
            { min: 4563, rate: 0.035 },
            { min: 5704, rate: 0.04 },
            { min: 6845, rate: 0.045 },
            { min: 7986, rate: 0.05 },
            { min: 9127, rate: 0.0525 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.015 },
            { min: 1711, rate: 0.02 },
            { min: 3422, rate: 0.025 },
            { min: 5133, rate: 0.03 },
            { min: 6844, rate: 0.035 },
            { min: 8555, rate: 0.04 },
            { min: 10266, rate: 0.045 },
            { min: 11977, rate: 0.05 },
            { min: 13688, rate: 0.0525 }
          ]
        },
        standardDeduction: {
          single: 13850,
          marriedFilingJointly: 27700,
          marriedFilingSeparately: 13850,
          headOfHousehold: 20800
        },
        personalExemption: {
          taxpayer: 2100,
          spouse: 2100,
          dependent: 1200
        }
      },

      // MONTANA - PROGRESSIVE TAX STATE
      MT: {
        state: 'MT',
        name: 'Montana',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.01 },
            { min: 3300, rate: 0.02 },
            { min: 5800, rate: 0.03 },
            { min: 8800, rate: 0.04 },
            { min: 11500, rate: 0.05 },
            { min: 14700, rate: 0.06 },
            { min: 19000, rate: 0.0675 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.01 },
            { min: 6600, rate: 0.02 },
            { min: 11600, rate: 0.03 },
            { min: 17600, rate: 0.04 },
            { min: 23000, rate: 0.05 },
            { min: 29400, rate: 0.06 },
            { min: 38000, rate: 0.0675 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.01 },
            { min: 3300, rate: 0.02 },
            { min: 5800, rate: 0.03 },
            { min: 8800, rate: 0.04 },
            { min: 11500, rate: 0.05 },
            { min: 14700, rate: 0.06 },
            { min: 19000, rate: 0.0675 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.01 },
            { min: 4950, rate: 0.02 },
            { min: 8700, rate: 0.03 },
            { min: 13200, rate: 0.04 },
            { min: 17250, rate: 0.05 },
            { min: 22050, rate: 0.06 },
            { min: 28500, rate: 0.0675 }
          ]
        },
        standardDeduction: {
          single: 5740,
          marriedFilingJointly: 11480,
          marriedFilingSeparately: 5740,
          headOfHousehold: 8610
        },
        personalExemption: {
          taxpayer: 3160,
          spouse: 3160,
          dependent: 3160
        }
      },

      // NEBRASKA - PROGRESSIVE TAX STATE
      NE: {
        state: 'NE',
        name: 'Nebraska',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0246 },
            { min: 3700, rate: 0.0351 },
            { min: 22170, rate: 0.0501 },
            { min: 35730, rate: 0.0584 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0246 },
            { min: 7390, rate: 0.0351 },
            { min: 44350, rate: 0.0501 },
            { min: 71460, rate: 0.0584 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0246 },
            { min: 3700, rate: 0.0351 },
            { min: 22170, rate: 0.0501 },
            { min: 35730, rate: 0.0584 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0246 },
            { min: 5540, rate: 0.0351 },
            { min: 33260, rate: 0.0501 },
            { min: 53590, rate: 0.0584 }
          ]
        },
        standardDeduction: {
          single: 8100,
          marriedFilingJointly: 16200,
          marriedFilingSeparately: 8100,
          headOfHousehold: 12150
        },
        personalExemption: {
          taxpayer: 156,
          spouse: 156,
          dependent: 156
        }
      },

      // NORTH DAKOTA - PROGRESSIVE TAX STATE  
      ND: {
        state: 'ND',
        name: 'North Dakota',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0105 },
            { min: 45350, rate: 0.0204 },
            { min: 109600, rate: 0.0227 },
            { min: 212000, rate: 0.0264 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0105 },
            { min: 75900, rate: 0.0204 },
            { min: 183050, rate: 0.0227 },
            { min: 281550, rate: 0.0264 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0105 },
            { min: 37950, rate: 0.0204 },
            { min: 91525, rate: 0.0227 },
            { min: 140775, rate: 0.0264 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0105 },
            { min: 60600, rate: 0.0204 },
            { min: 146400, rate: 0.0227 },
            { min: 246750, rate: 0.0264 }
          ]
        },
        standardDeduction: {
          single: 14600,
          marriedFilingJointly: 29200,
          marriedFilingSeparately: 14600,
          headOfHousehold: 21900
        }
      },

      // OKLAHOMA - PROGRESSIVE TAX STATE
      OK: {
        state: 'OK',
        name: 'Oklahoma',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0025 },
            { min: 1000, rate: 0.0075 },
            { min: 2500, rate: 0.0175 },
            { min: 3750, rate: 0.0275 },
            { min: 4900, rate: 0.0375 },
            { min: 7200, rate: 0.05 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0025 },
            { min: 2000, rate: 0.0075 },
            { min: 5000, rate: 0.0175 },
            { min: 7500, rate: 0.0275 },
            { min: 9800, rate: 0.0375 },
            { min: 14400, rate: 0.05 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0025 },
            { min: 1000, rate: 0.0075 },
            { min: 2500, rate: 0.0175 },
            { min: 3750, rate: 0.0275 },
            { min: 4900, rate: 0.0375 },
            { min: 7200, rate: 0.05 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0025 },
            { min: 1500, rate: 0.0075 },
            { min: 3750, rate: 0.0175 },
            { min: 5625, rate: 0.0275 },
            { min: 7350, rate: 0.0375 },
            { min: 10800, rate: 0.05 }
          ]
        },
        standardDeduction: {
          single: 7150,
          marriedFilingJointly: 14300,
          marriedFilingSeparately: 7150,
          headOfHousehold: 10725
        },
        personalExemption: {
          taxpayer: 1000,
          spouse: 1000,
          dependent: 1000
        }
      },

      // RHODE ISLAND - PROGRESSIVE TAX STATE
      RI: {
        state: 'RI',
        name: 'Rhode Island',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0375 },
            { min: 73450, rate: 0.0475 },
            { min: 167700, rate: 0.0599 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0375 },
            { min: 73450, rate: 0.0475 },
            { min: 167700, rate: 0.0599 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0375 },
            { min: 73450, rate: 0.0475 },
            { min: 167700, rate: 0.0599 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0375 },
            { min: 73450, rate: 0.0475 },
            { min: 167700, rate: 0.0599 }
          ]
        },
        standardDeduction: {
          single: 9900,
          marriedFilingJointly: 19800,
          marriedFilingSeparately: 9900,
          headOfHousehold: 14850
        },
        personalExemption: {
          taxpayer: 4750,
          spouse: 4750,
          dependent: 4750
        }
      },

      // VERMONT - PROGRESSIVE TAX STATE
      VT: {
        state: 'VT',
        name: 'Vermont',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.0335 },
            { min: 42050, rate: 0.066 },
            { min: 101900, rate: 0.076 },
            { min: 213150, rate: 0.0875 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.0335 },
            { min: 70450, rate: 0.066 },
            { min: 170200, rate: 0.076 },
            { min: 260300, rate: 0.0875 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.0335 },
            { min: 35225, rate: 0.066 },
            { min: 85100, rate: 0.076 },
            { min: 130150, rate: 0.0875 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.0335 },
            { min: 56250, rate: 0.066 },
            { min: 136050, rate: 0.076 },
            { min: 236750, rate: 0.0875 }
          ]
        },
        standardDeduction: {
          single: 7250,
          marriedFilingJointly: 14500,
          marriedFilingSeparately: 7250,
          headOfHousehold: 10875
        },
        personalExemption: {
          taxpayer: 4700,
          spouse: 4700,
          dependent: 4700
        }
      },

      // WEST VIRGINIA - PROGRESSIVE TAX STATE
      WV: {
        state: 'WV',
        name: 'West Virginia',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.04 },
            { min: 25000, rate: 0.045 },
            { min: 40000, rate: 0.06 },
            { min: 60000, rate: 0.065 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.04 },
            { min: 25000, rate: 0.045 },
            { min: 40000, rate: 0.06 },
            { min: 60000, rate: 0.065 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.04 },
            { min: 25000, rate: 0.045 },
            { min: 40000, rate: 0.06 },
            { min: 60000, rate: 0.065 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.03 },
            { min: 10000, rate: 0.04 },
            { min: 25000, rate: 0.045 },
            { min: 40000, rate: 0.06 },
            { min: 60000, rate: 0.065 }
          ]
        },
        standardDeduction: {
          single: 2000,
          marriedFilingJointly: 4000,
          marriedFilingSeparately: 2000,
          headOfHousehold: 3000
        },
        personalExemption: {
          taxpayer: 2300,
          spouse: 2300,
          dependent: 2300
        }
      },

      // DISTRICT OF COLUMBIA - PROGRESSIVE TAX STATE
      DC: {
        state: 'DC',
        name: 'District of Columbia',
        type: 'PROGRESSIVE',
        brackets: {
          single: [
            { min: 0, rate: 0.04 },
            { min: 10000, rate: 0.06 },
            { min: 40000, rate: 0.065 },
            { min: 60000, rate: 0.085 },
            { min: 350000, rate: 0.0925 },
            { min: 1000000, rate: 0.1075 }
          ],
          marriedFilingJointly: [
            { min: 0, rate: 0.04 },
            { min: 10000, rate: 0.06 },
            { min: 40000, rate: 0.065 },
            { min: 60000, rate: 0.085 },
            { min: 350000, rate: 0.0925 },
            { min: 1000000, rate: 0.1075 }
          ],
          marriedFilingSeparately: [
            { min: 0, rate: 0.04 },
            { min: 10000, rate: 0.06 },
            { min: 40000, rate: 0.065 },
            { min: 60000, rate: 0.085 },
            { min: 350000, rate: 0.0925 },
            { min: 1000000, rate: 0.1075 }
          ],
          headOfHousehold: [
            { min: 0, rate: 0.04 },
            { min: 10000, rate: 0.06 },
            { min: 40000, rate: 0.065 },
            { min: 60000, rate: 0.085 },
            { min: 350000, rate: 0.0925 },
            { min: 1000000, rate: 0.1075 }
          ]
        },
        standardDeduction: {
          single: 14850,
          marriedFilingJointly: 29700,
          marriedFilingSeparately: 14850,
          headOfHousehold: 22275
        },
        personalExemption: {
          taxpayer: 1775,
          spouse: 1775,
          dependent: 1775
        }
      }
    };
  }

  /**
   * Get state information
   */
  getStateInfo(state: string) {
    const config = this.stateConfigs[state.toUpperCase()];
    if (!config) return null;

    let rateInfo = '';
    if (config.type === 'FLAT') {
      const rate = config.brackets?.single?.[0]?.rate || 0;
      rateInfo = `Flat rate: ${(rate * 100).toFixed(2)}%`;
    } else if (config.type === 'PROGRESSIVE') {
      const brackets = config.brackets?.single || [];
      if (brackets.length > 0) {
        const minRate = brackets[0].rate;
        const maxRate = brackets[brackets.length - 1].rate;
        rateInfo = `${(minRate * 100).toFixed(2)}% - ${(maxRate * 100).toFixed(2)}%`;
      }
    } else if (config.type === 'SPECIAL') {
      rateInfo = `${((config.rate || 0) * 100).toFixed(2)}% on ${config.specialTaxType}`;
    } else {
      rateInfo = 'No state income tax';
    }

    return {
      state: config.state,
      name: config.name,
      type: config.type,
      rates: rateInfo,
      hasStandardDeduction: !!config.standardDeduction,
      hasPersonalExemption: !!config.personalExemption,
      notes: config.notes || []
    };
  }

  /**
   * Get all state abbreviations
   */
  getAllStates(): string[] {
    return Object.keys(this.stateConfigs);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

// Export instance
export const stateTaxCalculator2025 = new StateTaxCalculator2025();
