import { useState, useEffect, useCallback } from "react";
import {
  calculateMonthlyPayment,
  calculateAffordablePrice,
  PaymentParams,
  PaymentResult,
} from "../lib/paymentCalculator";

interface PaymentFilterState {
  paymentMin: string; // 'Any' or numeric string or '800+'
  paymentMax: string; // 'Any' or numeric string or '800+'
  downPayment: string;
}

interface VehicleInput {
  id: number;
  salePrice: number;
  year?: number | null;
}

interface UsePaymentFiltersProps {
  initialState?: Partial<PaymentFilterState>;
  onPaymentRangeChange?: (min: string, max: string) => void;
  debounceMs?: number;
}

interface VehicleWithPayment {
  id: number;
  salePrice: number;
  calculatedPayment?: number;
  paymentError?: string;
}

export function usePaymentFilters({
  initialState = {},
  onPaymentRangeChange,
  debounceMs = 300,
}: UsePaymentFiltersProps = {}) {
  // Payment filter state
  const [paymentState, setPaymentState] = useState<PaymentFilterState>({
    paymentMin: initialState.paymentMin || "Any",
    paymentMax: initialState.paymentMax || "Any",
    downPayment: initialState.downPayment || "2000",
  });

  // Calculation states
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [affordablePriceRange, setAffordablePriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);

  // Debounced calculation effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAffordablePriceRange();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [
    paymentState.paymentMin,
    paymentState.paymentMax,
    paymentState.downPayment,
  ]);

  // Calculate affordable price range based on payment range
  const calculateAffordablePriceRange = useCallback(async () => {
    try {
      setIsCalculating(true);
      setCalculationError(null);

      const downPaymentNum = parseFloat(paymentState.downPayment) || 0;
      // allow initialState to provide defaults for interest/term (backwards compatibility)
      const defaultInterest =
        parseFloat((initialState as any).interestRate || "5") || 5;
      const defaultTerm =
        parseInt((initialState as any).loanTermMonths || "60") || 60;

      const interestRateNum = defaultInterest;
      const loanTermNum = defaultTerm;

      const paymentMinNum =
        parseFloat(
          paymentState.paymentMin === "Any" ? "0" : paymentState.paymentMin,
        ) || 0;
      const paymentMaxNum =
        parseFloat(
          paymentState.paymentMax === "Any"
            ? "10000"
            : paymentState.paymentMax === "800+"
              ? "10000"
              : paymentState.paymentMax,
        ) || 10000;

      if (paymentMinNum <= 0 && paymentState.paymentMin !== "Any") {
        setAffordablePriceRange(null);
        return;
      }

      const minAffordablePrice = calculateAffordablePrice(
        paymentMinNum,
        downPaymentNum,
        interestRateNum,
        loanTermNum,
      );

      const maxAffordablePrice = calculateAffordablePrice(
        paymentMaxNum,
        downPaymentNum,
        interestRateNum,
        loanTermNum,
      );

      setAffordablePriceRange({
        min: Math.round(minAffordablePrice),
        max: Math.round(maxAffordablePrice),
      });

      // Notify parent component about payment range change
      if (onPaymentRangeChange) {
        onPaymentRangeChange(paymentState.paymentMin, paymentState.paymentMax);
      }
    } catch (error) {
      console.error("Payment calculation error:", error);
      setCalculationError(
        error instanceof Error ? error.message : "Calculation failed",
      );
      setAffordablePriceRange(null);
    } finally {
      setIsCalculating(false);
    }
  }, [
    paymentState.paymentMin,
    paymentState.paymentMax,
    paymentState.downPayment,
    onPaymentRangeChange,
  ]);

  // Calculate payment for a specific vehicle
  const getPresetLoanRules = (year?: number | null, price?: number) => {
    const y = year || 0;
    const p = price || 0;

    if (y >= 2023 && y <= 2025) {
      if (p > 50000) return { interestRate: 5.5, loanTermMonths: 84 };
      return { interestRate: 5.5, loanTermMonths: 72 };
    }
    if (y >= 2018 && y <= 2022)
      return { interestRate: 7.5, loanTermMonths: 72 };
    if (y >= 2013 && y <= 2017)
      return { interestRate: 9.5, loanTermMonths: 60 };
    if (y >= 2009 && y <= 2012)
      return { interestRate: 11.5, loanTermMonths: 60 };
    if (y >= 2005 && y <= 2008)
      return { interestRate: 13.5, loanTermMonths: 48 };
    if (y <= 2000) return { interestRate: 17.5, loanTermMonths: 36 };
    // default fallback
    return { interestRate: 13.5, loanTermMonths: 48 };
  };

  const calculateVehiclePayment = useCallback(
    (salePrice: number, year?: number | null): PaymentResult | null => {
      try {
        const rules = getPresetLoanRules(year, salePrice);
        const params: PaymentParams = {
          salePrice,
          downPayment: parseFloat(paymentState.downPayment) || 0,
          interestRate: rules.interestRate,
          loanTermMonths: rules.loanTermMonths,
        };

        return calculateMonthlyPayment(params);
      } catch (error) {
        console.error("Vehicle payment calculation error:", error);
        return null;
      }
    },
    [paymentState],
  );

  // Calculate payments for multiple vehicles
  const calculateBulkPayments = useCallback(
    async (vehicles: VehicleInput[]): Promise<VehicleWithPayment[]> => {
      try {
        setIsCalculating(true);

        // Client-side calculation using preset loan rules per vehicle
        const results = vehicles.map((vehicle) => {
          const payment = calculateVehiclePayment(
            vehicle.salePrice,
            (vehicle as any).year || null,
          );
          return {
            id: vehicle.id,
            salePrice: vehicle.salePrice,
            calculatedPayment: payment
              ? Math.round(payment.monthlyPayment)
              : undefined,
            paymentError: payment ? undefined : "Calculation failed",
          } as VehicleWithPayment;
        });

        return results;
      } catch (error) {
        console.error("Bulk payment calculation error:", error);
        // Fallback safe path: return empty calculations
        return vehicles.map((vehicle) => ({
          id: vehicle.id,
          salePrice: vehicle.salePrice,
          calculatedPayment: undefined,
          paymentError: "Calculation failed",
        }));
      } finally {
        setIsCalculating(false);
      }
    },
    [paymentState, calculateVehiclePayment],
  );

  // Update payment state
  const updatePaymentState = useCallback(
    (updates: Partial<PaymentFilterState>) => {
      setPaymentState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // Reset to default values
  const resetPaymentFilters = useCallback(() => {
    setPaymentState({
      paymentMin: "Any",
      paymentMax: "Any",
      downPayment: "2000",
    });
  }, []);

  // Check if vehicle matches payment filter
  const vehicleMatchesPaymentFilter = useCallback(
    (salePrice: number): boolean => {
      if (!affordablePriceRange) return true;

      return (
        salePrice >= affordablePriceRange.min &&
        salePrice <= affordablePriceRange.max
      );
    },
    [affordablePriceRange],
  );

  return {
    // State
    paymentState,
    isCalculating,
    calculationError,
    affordablePriceRange,

    // Actions
    updatePaymentState,
    resetPaymentFilters,
    calculateVehiclePayment,
    calculateBulkPayments,
    vehicleMatchesPaymentFilter,

    // Computed values
    formattedAffordableRange: affordablePriceRange
      ? `$${affordablePriceRange.min.toLocaleString()} - $${affordablePriceRange.max.toLocaleString()}`
      : null,
  };
}
