import { useEffect, useState } from 'react'
import './App.css'

const POKEMON_NAME = 'mew'
const POKEMON_ID = 151

const POKEMON_URL = `https://pokeapi.co/api/v2/pokemon/${POKEMON_NAME}`
const SPECIES_URL = `https://pokeapi.co/api/v2/pokemon-species/${POKEMON_NAME}`
const MEW_SPRITE = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${POKEMON_ID}.png`
const MEW_CRY = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${POKEMON_ID}.ogg`

const DECIMETERS_PER_METER = 10
const HECTOGRAMS_PER_KILOGRAM = 10
const MAX_BASE_STAT = 200

function getJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json()
  })
}

function getEnglishEntry(entries) {
  return entries.find((entry) => entry.language.name === 'en')
}

function getEnglishFlavor(entries) {
  const entry = getEnglishEntry(entries)
  return entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : 'No description available.'
}

function describeAbility(ability) {
  return getEnglishFlavor(ability.flavor_text_entries)
}

function playCry() {
  const audio = new Audio(MEW_CRY)
  audio.play().catch((error) => console.error('Unable to play Mew cry:', error))
}

function App() {
  const [pokemon, setPokemon] = useState(null)
  const [species, setSpecies] = useState(null)
  const [abilityDetails, setAbilityDetails] = useState([])
  const [showShiny, setShowShiny] = useState(false)
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadMew() {
      setStatus('loading')

      try {
        const [pokemonData, speciesData] = await Promise.all([
          getJson(POKEMON_URL),
          getJson(SPECIES_URL),
        ])

        const abilities = await Promise.all(
          pokemonData.abilities.map((item) => getJson(item.ability.url)),
        )

        if (cancelled) return

        setPokemon(pokemonData)
        setSpecies(speciesData)
        setAbilityDetails(abilities)
        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        console.error('Failed to load Mew:', error)
        setStatus('error')
      }
    }

    loadMew()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (status === 'loading') {
    return (
      <div className="loading" role="status">
        <img src={MEW_SPRITE} alt="" />
        <p>Loading Mew...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="error" role="alert">
        <p>Something went wrong while loading Mew.</p>
        <button className="retry-btn" onClick={() => setReloadKey((key) => key + 1)}>
          Try Again
        </button>
      </div>
    )
  }

  const englishGenus = getEnglishEntry(species.genera)
  const genus = englishGenus ? englishGenus.genus : 'Unknown'
  const flavorText = getEnglishFlavor(species.flavor_text_entries)

  const types = pokemon.types.map((item) => item.type.name)
  const moves = pokemon.moves.map((item) => item.move.name)
  const stats = pokemon.stats

  const sprite = showShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default

  return (
    <div className="pokedex">
      <header className="pokedex-top">
        <div className="hinge" aria-hidden="true" />
        <div className="lights" aria-hidden="true">
          <span className="light light-blue" />
          <span className="light light-red" />
          <span className="light light-yellow" />
        </div>
        <div className="title-box">
          <h1>MEW</h1>
          <h2>National Pokedex Entry</h2>
        </div>
      </header>

      <main>
        <div className="screen">
          <div className="screen-header">
            <span className="screen-id">No. {pokemon.id}</span>
            <h2 className="pokemon-name">{pokemon.name.toUpperCase()}</h2>
            <span className="genus">{genus}</span>
          </div>

          <div className="screen-main">
            <div className="sprite-column">
              <button
                className="sprite-btn"
                onClick={() => setShowShiny((value) => !value)}
                aria-label="Toggle shiny Mew"
                aria-pressed={showShiny}
              >
                <img src={sprite} alt="" />
              </button>
              <button className="cry-btn" onClick={playCry}>
                Pokemon Cry
              </button>
            </div>

            <div className="screen-info">
              <div className="tag-row">
                {types.map((type) => (
                  <span key={type} className={`type-badge type-${type}`}>
                    {type}
                  </span>
                ))}
                {species.is_mythical && <span className="tag-mythical">Mythical</span>}
              </div>

              <dl className="metrics">
                <div className="metric">
                  <dt>Height</dt>
                  <dd>{pokemon.height / DECIMETERS_PER_METER} m</dd>
                </div>
                <div className="metric">
                  <dt>Weight</dt>
                  <dd>{pokemon.weight / HECTOGRAMS_PER_KILOGRAM} kg</dd>
                </div>
                <div className="metric">
                  <dt>Base Exp</dt>
                  <dd>{pokemon.base_experience}</dd>
                </div>
                <div className="metric">
                  <dt>Capture</dt>
                  <dd>{species.capture_rate}</dd>
                </div>
                <div className="metric">
                  <dt>Gender</dt>
                  <dd>{species.gender_rate === -1 ? 'Genderless' : 'Mixed'}</dd>
                </div>
                <div className="metric">
                  <dt>Habitat</dt>
                  <dd>{species.habitat.name}</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="flavor-text">"{flavorText}"</p>
        </div>

        <div className="pokedex-bottom">
          <section className="panel stats-panel">
            <h3>Base Stats</h3>
            {stats.map((stat) => (
              <StatBar key={stat.stat.name} label={stat.stat.name} value={stat.base_stat} />
            ))}
          </section>

          <section className="panel abilities-panel">
            <h3>Abilities</h3>
            <ul className="ability-list">
              {abilityDetails.map((ability) => (
                <li key={ability.name} className="ability-block">
                  <p className="ability-name">{ability.name}</p>
                  <p className="ability-desc">{describeAbility(ability)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel moves-panel">
            <h3>All Moves Mew Can Learn ({moves.length})</h3>
            <ul className="chip-list moves-list">
              {moves.map((move) => (
                <li key={move} className="chip">
                  {move}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <footer className="deck">
        <div className="dpad" aria-hidden="true">
          <span className="dpad-up" />
          <span className="dpad-left" />
          <span className="dpad-center" />
          <span className="dpad-right" />
          <span className="dpad-down" />
        </div>
        <div className="deck-buttons" aria-hidden="true">
          <span className="deck-button" />
          <span className="deck-button" />
          <span className="deck-button-lg" />
        </div>
      </footer>
    </div>
  )
}

function StatBar({ label, value, max = MAX_BASE_STAT }) {
  const percent = Math.min((value / max) * 100, 100)

  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  )
}

export default App
