"use client";

import { CalendarDays, ChevronDown, MapPin, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchField } from "./SearchField";

type SearchBarProps = {
  defaultDestination?: string;
};

export function SearchBar({ defaultDestination = "" }: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(defaultDestination);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    params.set("rooms", String(rooms));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative z-20 mx-auto w-full max-w-[1120px] overflow-visible rounded-[18px] border border-border bg-white shadow-[0_16px_40px_rgba(7,16,12,0.16)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <SearchField icon={MapPin} label="Destination" className="lg:border-r lg:border-border">
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-transparent text-sm text-ink-soft outline-none placeholder:text-muted"
            name="destination"
          />
        </SearchField>
        <SearchField icon={CalendarDays} label="Check-in" className="border-t border-border lg:border-t-0 lg:border-r">
          <DateInput value={checkIn} onChange={setCheckIn} label="Check-in date" />
        </SearchField>
        <SearchField icon={CalendarDays} label="Check-out" className="border-t border-border lg:border-t-0 lg:border-r">
          <DateInput value={checkOut} onChange={setCheckOut} label="Check-out date" />
        </SearchField>
        <div className="relative flex min-w-0 flex-1 items-center border-t border-border lg:border-t-0 lg:border-r">
          <SearchField icon={Users} label="Guests & Rooms">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm text-ink-soft"
              onClick={() => setGuestOpen((open) => !open)}
            >
              <span>
                {guests} guests, {rooms} room{rooms > 1 ? "s" : ""}
              </span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          </SearchField>
          {guestOpen ? (
            <div className="absolute left-4 right-4 top-[72px] z-30 rounded-xl border border-border bg-white p-4 shadow-lg lg:left-0 lg:right-auto lg:w-64">
              <Stepper label="Guests" value={guests} min={1} onChange={setGuests} />
              <Stepper label="Rooms" value={rooms} min={1} onChange={setRooms} />
            </div>
          ) : null}
        </div>
        <div className="p-3">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark lg:h-full lg:min-w-[132px]"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}

function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <span className="relative block">
      {!value ? <span className="pointer-events-none absolute inset-0 text-sm text-muted">Add dates</span> : null}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full bg-transparent text-sm outline-none ${value ? "text-ink-soft" : "text-transparent"}`}
        aria-label={label}
      />
    </span>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between last:mb-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-7 w-7 rounded-full border border-border"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button
          type="button"
          className="h-7 w-7 rounded-full border border-border"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
