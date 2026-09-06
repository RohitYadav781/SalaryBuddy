import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
export interface Breakdown {
  grossMonthly: string;
  deductions: string;
  inHandMonthly: string;
}

export interface ExpenseBreakdown {
  needs: string;
  wants: string;
  savings: string;
}

export interface CityRecommendation {
  tier: string;
  cities: string;
  rentRange: string;
  savingsPotential: string;
  status: string;
}

export interface NegotiationTarget {
  targetInHand: string;
  requiredGross: string;
  requiredHikePct: string;
  grossDifference: string;
}

@Component({
  selector: 'app-calculator',
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
})
export class Calculator {
isAmountMode = false;
  oldSalary: number | null = null;
  secondInput: number | null = null;
  taxRate: number | null = 10;
  actualExpenses: number | null = null;
  targetInHand: number | null = null;

  hasCalculated = false;
  errorMessage = '';

  incrementPercent = '0';
  incrementAmount = '0';

  monthlyBreakdown: Breakdown = { grossMonthly: '0', deductions: '0', inHandMonthly: '0' };
  expenseBreakdown: ExpenseBreakdown = { needs: '0', wants: '0', savings: '0' };
  cityRecommendation: CityRecommendation | null = null;
  negotiationTarget: NegotiationTarget | null = null;

  expenseStatusText = '';
  isDeficit = false;
  currentInHand = 0;

  toggleMode(): void {
    this.isAmountMode = !this.isAmountMode;
    this.hasCalculated = false;
    this.errorMessage = '';
    this.oldSalary = null;
    this.secondInput = null;
    this.actualExpenses = null;
    this.targetInHand = null;
    this.cityRecommendation = null;
    this.negotiationTarget = null;
  }

  runAllCalculations(): void {
    if (!this.oldSalary || !this.secondInput || this.oldSalary <= 0 || this.secondInput <= 0) {
      this.hasCalculated = false;
      return;
    }

    this.errorMessage = '';
    this.hasCalculated = true;

    // 1. Increment logic
    let calculatedSalary = 0;
    if (!this.isAmountMode) {
      const hike = this.secondInput - this.oldSalary;
      const pct = (hike / this.oldSalary) * 100;
      this.incrementPercent = pct.toFixed(2);
      this.incrementAmount = Math.round(hike).toLocaleString();
      calculatedSalary = this.secondInput;
    } else {
      const hike = this.oldSalary * (this.secondInput / 100);
      const total = this.oldSalary + hike;
      this.incrementPercent = this.secondInput.toString();
      this.incrementAmount = Math.round(hike).toLocaleString();
      calculatedSalary = total;
    }

    // 2. In-Hand logic
    const rate = this.taxRate && this.taxRate >= 0 ? this.taxRate : 0;
    const gross = calculatedSalary;
    const deductions = gross * (rate / 100);
    this.currentInHand = gross - deductions;

    this.monthlyBreakdown = {
      grossMonthly: Math.round(gross).toLocaleString(),
      deductions: Math.round(deductions).toLocaleString(),
      inHandMonthly: Math.round(this.currentInHand).toLocaleString()
    };

    // 3. 50/30/20 Budget logic
    this.expenseBreakdown = {
      needs: Math.round(this.currentInHand * 0.5).toLocaleString(),
      wants: Math.round(this.currentInHand * 0.3).toLocaleString(),
      savings: Math.round(this.currentInHand * 0.2).toLocaleString()
    };

    // 4. City Affordability logic
    this.evaluateCityFit(this.currentInHand);

    // 5. Expense surplus check
    this.evaluateActualExpenses();

    // 6. Target Offer / Negotiation Calculator
    this.calculateCounterOffer();
  }

  calculateCounterOffer(): void {
    if (!this.targetInHand || this.targetInHand <= 0 || !this.oldSalary || this.oldSalary <= 0) {
      this.negotiationTarget = null;
      return;
    }

    const rate = this.taxRate && this.taxRate >= 0 ? this.taxRate : 0;
    const decimalKeep = 1 - (rate / 100);

    // Required Gross = Target In-Hand / (1 - Deduction Rate)
    const requiredGross = decimalKeep > 0 ? this.targetInHand / decimalKeep : this.targetInHand;
    const grossDifference = requiredGross - this.oldSalary;
    const hikePct = ((requiredGross - this.oldSalary) / this.oldSalary) * 100;

    this.negotiationTarget = {
      targetInHand: Math.round(this.targetInHand).toLocaleString(),
      requiredGross: Math.round(requiredGross).toLocaleString(),
      requiredHikePct: hikePct.toFixed(1),
      grossDifference: Math.round(grossDifference).toLocaleString()
    };
  }

  evaluateCityFit(salary: number): void {
    if (salary < 15000) {
      this.cityRecommendation = {
        tier: 'Budget Warning',
        cities: 'Living with Family / Shared Dormitory / PG',
        rentRange: '1,500 – 3,000 (Bed in PG)',
        savingsPotential: 'Minimal to None',
        status: 'High Strain'
      };
    } else if (salary < 25000) {
      this.cityRecommendation = {
        tier: 'Tier 3 / Small Towns',
        cities: 'Nagpur, Bhopal, Rajkot, Jabalpur, Bareilly',
        rentRange: '4,000 – 7,000 (1RK / Shared flat)',
        savingsPotential: 'Tight (2,000 – 4,000)',
        status: 'Strict Budget'
      };
    } else if (salary < 50000) {
      this.cityRecommendation = {
        tier: 'Tier 2 Hubs',
        cities: 'Ahmedabad, Surat, Vadodara, Indore, Jaipur',
        rentRange: '8,000 – 13,000 (1BHK / Shared 2BHK)',
        savingsPotential: 'Comfortable (8,000 – 12,000)',
        status: 'Balanced Living'
      };
    } else if (salary < 85000) {
      this.cityRecommendation = {
        tier: 'Tier 1.5 / Value Metros',
        cities: 'Pune, Hyderabad, Chennai, Kolkata',
        rentRange: '14,000 – 20,000 (1BHK / Shared 2BHK)',
        savingsPotential: 'High (15,000+)',
        status: 'Great Balance'
      };
    } else {
      this.cityRecommendation = {
        tier: 'Tier 1 Prime Metros',
        cities: 'Bengaluru, Mumbai, Gurgaon, Delhi NCR',
        rentRange: '22,000 – 35,000 (1BHK)',
        savingsPotential: 'Very High (25,000+)',
        status: 'Optimal Comfort'
      };
    }
  }

  evaluateActualExpenses(): void {
    if (this.actualExpenses === null || !this.hasCalculated) {
      this.expenseStatusText = '';
      return;
    }

    const net = this.currentInHand - this.actualExpenses;
    if (net >= 0) {
      this.isDeficit = false;
      this.expenseStatusText = `Remaining to Save: ${Math.round(net).toLocaleString()}`;
    } else {
      this.isDeficit = true;
      this.expenseStatusText = `Over Budget by: ${Math.round(Math.abs(net)).toLocaleString()}`;
    }
  }
}