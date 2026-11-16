package com.innoverzion.functionalsportsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FunctionalSportSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(FunctionalSportSystemApplication.class, args);
	}

}
