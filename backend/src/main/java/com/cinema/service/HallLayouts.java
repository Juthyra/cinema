package com.cinema.service;

import com.cinema.domain.HallType;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Seat layouts for every {@link HallType}. Layouts are fixed, so they are built once. */
public final class HallLayouts {

    /** One seat position. {@code gapBefore} draws an aisle to its left. */
    public record SeatSpec(String row, int number, String kind, String section, boolean gapBefore) {
        public String key() { return row + number; }
    }

    public record Layout(HallType type, List<String> rows, int seatsPerRow, int maxSeats,
                         List<SeatSpec> seats) {
        public Set<String> keys() {
            return seats.stream().map(SeatSpec::key).collect(Collectors.toSet());
        }
    }

    private static final Map<HallType, Layout> LAYOUTS = new EnumMap<>(HallType.class);

    static {
        // Original layout - the default: 8 rows x 10 single seats.
        LAYOUTS.put(HallType.STANDARD, build(HallType.STANDARD, 4,
                new Block("ABCDEFGH", 10, "STANDARD", "Main", 0)));
        // Pods of 4 seats side by side, aisle between the two pods.
        LAYOUTS.put(HallType.FAMILY, build(HallType.FAMILY, 6,
                new Block("ABCDEF", 8, "FAMILY", "Family pods", 5)));
        // Double love seats; one seat = two people.
        LAYOUTS.put(HallType.COUPLE, build(HallType.COUPLE, 4,
                new Block("ABCDEF", 6, "COUPLE", "Love seats", 4)));
        // Premium recliners, curved look is drawn by the frontend.
        LAYOUTS.put(HallType.MODERN, build(HallType.MODERN, 4,
                new Block("ABCDEF", 6, "RECLINER", "Recliners", 4)));
        // Three sections: single, couple, accessible.
        LAYOUTS.put(HallType.MIXED, build(HallType.MIXED, 4,
                new Block("ABCD", 8, "SINGLE", "Single", 5),
                new Block("EF", 4, "COUPLE", "Couple", 3),
                new Block("G", 4, "ACCESSIBLE", "Accessible", 3)));
    }

    private HallLayouts() {
    }

    public static Layout of(HallType type) {
        return LAYOUTS.get(type == null ? HallType.STANDARD : type);
    }

    private record Block(String rows, int seatsPerRow, String kind, String section, int gapBeforeNumber) {
    }

    private static Layout build(HallType type, int maxSeats, Block... blocks) {
        List<String> rows = new ArrayList<>();
        List<SeatSpec> seats = new ArrayList<>();
        int widest = 0;
        for (Block b : blocks) {
            widest = Math.max(widest, b.seatsPerRow());
            for (char c : b.rows().toCharArray()) {
                String row = String.valueOf(c);
                rows.add(row);
                for (int n = 1; n <= b.seatsPerRow(); n++) {
                    seats.add(new SeatSpec(row, n, b.kind(), b.section(), n == b.gapBeforeNumber()));
                }
            }
        }
        return new Layout(type, List.copyOf(rows), widest, maxSeats, List.copyOf(seats));
    }
}
