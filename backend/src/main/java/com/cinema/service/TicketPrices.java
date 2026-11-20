package com.cinema.service;

import java.util.Map;

/**
 * Ticket prices in sen (1/100 ringgit) by seat kind.
 *
 * Mid-tier Klang Valley pricing, checked against published 2026 rates: a
 * standard adult 2D seat sells for roughly RM14-23 (RM16-19 on flat-rate
 * promotions), couple/twin seats carry a small premium, premium recliner halls
 * run RM17-30 and OKU seats RM10-15.
 */
public final class TicketPrices {

    private static final Map<String, Integer> BY_KIND = Map.of(
            "STANDARD", 1800,
            "SINGLE", 1800,
            "FAMILY", 1800,
            "COUPLE", 3000,     // one love seat holds two people
            "RECLINER", 2600,
            "ACCESSIBLE", 1200);

    private static final int FALLBACK_SEN = 1800;

    private TicketPrices() {
    }

    /** Price for a seat kind; unknown kinds fall back to the standard price. */
    public static int of(String kind) {
        if (kind == null) {
            return FALLBACK_SEN;
        }
        return BY_KIND.getOrDefault(kind, FALLBACK_SEN);
    }
}
