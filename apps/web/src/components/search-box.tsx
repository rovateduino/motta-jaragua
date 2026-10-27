import { Input, SearchIcon } from "@motta/ui";

interface SearchBoxProps {
  id?: string;
  defaultValue?: string;
  className?: string;
}

export function SearchBox({
  id = "busca-produtos",
  defaultValue = "",
  className,
}: SearchBoxProps) {
  return (
    <form action="/catalogo" role="search" className={`relative w-full ${className ?? ""}`}>
      <label htmlFor={id} className="sr-only">
        Buscar produtos
      </label>
      <Input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscar produtos"
        className="h-10 pr-12"
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-motta-red text-white transition-colors hover:bg-motta-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red focus-visible:ring-offset-2"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    </form>
  );
}
