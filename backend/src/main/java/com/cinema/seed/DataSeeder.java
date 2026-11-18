package com.cinema.seed;

import com.cinema.domain.Movie;
import com.cinema.domain.Showtime;
import com.cinema.domain.HallType;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.ShowtimeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds a small demo catalogue on first start (when the movies table is empty).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final MovieRepository movies;
    private final ShowtimeRepository showtimes;

    public DataSeeder(MovieRepository movies, ShowtimeRepository showtimes) {
        this.movies = movies;
        this.showtimes = showtimes;
    }

    @Override
    @Transactional
    public void run(String... args) {
        backfillHallTypes();
        if (movies.count() > 0) {
            return;
        }
        LocalDate today = LocalDate.now();
        LocalDateTime[] slots = {
                at(today, 14, 0),   at(today, 17, 30),   at(today, 21, 0),
                at(today.plusDays(1), 14, 0), at(today.plusDays(1), 17, 30), at(today.plusDays(1), 21, 0)
        };

        Movie midnightCircuit = new Movie("The Midnight Circuit",
                "A burned-out courier races a city that reboots itself at dawn.", "Sci-Fi Thriller", 128);
        Movie paperMoons = new Movie("Paper Moons",
                "Two strangers fold their regrets into paper moons that drift across a border.", "Drama", 104);
        Movie steelHarvest = new Movie("Steel Harvest",
                "A rogue machine-farm collective fights the corporation that owns the soil.", "Action", 142);
        Movie quietOrbit = new Movie("A Quiet Orbit",
                "Life on a space station, told by the people who keep the lights on.", "Documentary", 92);
        Movie laughingInOrbit = new Movie("Laughing in Orbit",
                "Ground control's worst week in the history of space operations.", "Comedy", 101);
        List<Movie> catalog = List.of(midnightCircuit, paperMoons, steelHarvest, quietOrbit, laughingInOrbit);

        for (int i = 0; i < catalog.size(); i++) {
            Movie movie = catalog.get(i);
            for (int k = 0; k < 2; k++) {
                int slotIndex = (i * 2 + k) % slots.length;
                LocalDateTime base = slots[slotIndex];
                LocalDateTime when = base.isBefore(LocalDateTime.now()) ? base.plusDays(1) : base;
                movie.addShowtime(new Showtime(movie, "Hall " + (i % 5 + 1), when));
            }
            movies.save(movie);
        }
        System.out.println("Seeded " + movies.count() + " movies with showtimes.");
    }

    /** Showtimes created before hall types existed get a type from their hall name. */
    private void backfillHallTypes() {
        showtimes.findAll().stream()
                .filter(s -> s.getHallType() == HallType.STANDARD && s.getHall() != null
                        && HallType.forHallName(s.getHall()) != HallType.STANDARD)
                .forEach(s -> {
                    s.setHallType(HallType.forHallName(s.getHall()));
                    showtimes.save(s);
                });
    }

    private static LocalDateTime at(LocalDate day, int hour, int minute) {
        return day.atTime(hour, minute);
    }
}
