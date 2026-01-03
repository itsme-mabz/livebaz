import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Leagues.css';
import { LeaguesGridSkeleton, LeagueAccordionListSkeleton } from '../components/SkeletonLoader/SkeletonLoader';



function Leagues() {
    const [allLeagues, setAllLeagues] = useState([]);
    const [leaguesByCountry, setLeaguesByCountry] = useState({});
    const [expandedCountries, setExpandedCountries] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const response = await axios.get('/api/v1/football-events/get-leagues');
                if (Array.isArray(response.data)) {
                    setAllLeagues(response.data);

                    // Group leagues by country
                    const grouped = response.data.reduce((acc, league) => {
                        const country = league.country_name || 'World';
                        if (!acc[country]) {
                            acc[country] = [];
                        }
                        acc[country].push(league);
                        return acc;
                    }, {});

                    setLeaguesByCountry(grouped);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching leagues:', error);
                setLoading(false);
            }
        };

        fetchLeagues();
    }, []);

    const toggleCountry = (country) => {
        setExpandedCountries(prev => ({
            ...prev,
            [country]: !prev[country]
        }));
    };

    return (
        <div>
            <meta charSet="UTF-8" />
            <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
            <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
            <title>List of all Football Leagues and Competitions</title>
            <meta name="description" content="List of international and national football competitions with statistics, standings and analyses" />
            <link rel="canonical" href="https://ratingbet.com/football/competitions/" />

            <main className="league-review-page">
                <div className="wrap">
                    <div className="breadcrumbs fl_c">
                        <a href="/" className="breadcrumbs-point fl_c">Livebaz</a>
                        <span className="breadcrumbs-last fl_c">
                            Leagues
                        </span>
                    </div>
                    <article>
                        <div className="container container_70x30" style={{ direction: 'ltr' }}>
                            <div className="container-main">
                                <section className="leagues">
                                    <h1 className=" page-titleleagues">Football Competitions</h1>
                                    <div className="section-title">Popular leagues</div>

                                    {loading ? (
                                        <>
                                            <LeaguesGridSkeleton />
                                            <div className="section-title" style={{ marginTop: '40px' }}>All leagues by country</div>
                                            <LeagueAccordionListSkeleton items={15} />
                                        </>
                                    ) : (
                                        <>
                                            <div className="leagues-pop">
                                                {allLeagues.slice(0, 32).map((league) => (
                                                    <Link
                                                        key={league.league_id}
                                                        to={`/league/${league.league_id}`}
                                                        className="leagues-pop-item fl_col_c_c"
                                                    >
                                                        <div className="image">
                                                            <img
                                                                srcSet={`${league.league_logo} 30w, ${league.league_logo} 50w, ${league.league_logo} 80w, ${league.league_logo} 150w`}
                                                                sizes="(max-width:40px) 30px, (max-width:65px) 50px, (max-width:115px) 80px, 150px"
                                                                decoding="async"
                                                                alt={league.league_name}
                                                                src={league.league_logo}
                                                            />
                                                        </div>
                                                        <p className="title">{league.league_name}</p>
                                                        <span className="date">{league.country_name || 'International'}</span>
                                                    </Link>
                                                ))}
                                            </div>

                                            <div className="section-title">All leagues by country</div>
                                            <div className="leagues-accordion">
                                                {Object.keys(leaguesByCountry)
                                                    .sort()
                                                    .map((country) => (
                                                        <div
                                                            key={country}
                                                            className={`simple-box ${expandedCountries[country] ? 'simple-box__active' : ''}`}
                                                        >
                                                            <div
                                                                className="simple-box-title"
                                                                onClick={() => toggleCountry(country)}
                                                            >
                                                                {country} ({leaguesByCountry[country].length})
                                                            </div>
                                                            {expandedCountries[country] && (
                                                                <div className="simple-box-description">
                                                                    {leaguesByCountry[country].map((league) => (
                                                                        <Link
                                                                            key={league.league_id}
                                                                            to={`/league/${league.league_id}`}
                                                                            className="link fl"
                                                                        >
                                                                            <div className="image">
                                                                                {league.league_logo ? (
                                                                                    <img
                                                                                        src={league.league_logo}
                                                                                        alt={league.league_name}
                                                                                        width="30"
                                                                                        height="30"
                                                                                        decoding="async"
                                                                                    />
                                                                                ) : (
                                                                                    <div style={{
                                                                                        width: '30px',
                                                                                        height: '30px',
                                                                                        backgroundColor: '#f0f0f0',
                                                                                        borderRadius: '4px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        fontSize: '10px',
                                                                                        color: '#999'
                                                                                    }}>
                                                                                        {league.league_name.substring(0, 2).toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <p className="title">{league.league_name}</p>
                                                                                <span className="date">{league.country_name || 'International'}</span>
                                                                            </div>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </>
                                    )}
                                </section>
                            </div>

                        </div>
                    </article>
                </div>
            </main>
        </div>
    );
}

export default Leagues;