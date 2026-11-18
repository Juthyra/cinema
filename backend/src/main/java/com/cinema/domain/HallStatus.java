package com.cinema.domain;

/** Operating state of a hall. Only ACTIVE halls accept new bookings. */
public enum HallStatus {
    ACTIVE("Active"),
    MAINTENANCE("Maintenance"),
    CLOSED("Closed");

    private final String label;

    HallStatus(String label) {
        this.label = label;
    }

    public String label() { return label; }
}
