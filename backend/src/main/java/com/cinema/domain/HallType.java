package com.cinema.domain;

/**
 * The kinds of cinema hall. STANDARD is the original layout and the default.
 * The seat layout for each type lives in {@code com.cinema.service.HallLayouts}.
 */
public enum HallType {
    STANDARD("Standard", "Classic hall with single seats in 8 rows."),
    FAMILY("Family", "Seats grouped in pods of 4 so families sit together. Up to 6 seats per booking."),
    COUPLE("Couple", "Cosy double love seats - each seat fits two people."),
    MODERN("Modern", "Premium recliners with extra legroom in a curved layout."),
    MIXED("3-Section",
            "Three sections: single seats, couple love seats and wheelchair-accessible spaces.");

    private final String label;
    private final String description;

    HallType(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String label() { return label; }
    public String description() { return description; }

    /** Maps the legacy "Hall N" names to a type (used to backfill old showtimes). */
    public static HallType forHallName(String hall) {
        if (hall == null) return STANDARD;
        return switch (hall.trim()) {
            case "Hall 2" -> FAMILY;
            case "Hall 3" -> COUPLE;
            case "Hall 4" -> MODERN;
            case "Hall 5" -> MIXED;
            default -> STANDARD;
        };
    }
}
