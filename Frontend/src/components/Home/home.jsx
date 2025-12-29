import React, { useState, useEffect } from "react";
import DynamicForecasts from "../DynamicForecast/DynamicForecast";
import LiveUpdate from "../LiveUpdates/LiveUpdates";
import { replaceTranslation } from "../../utils/translationReplacer.jsx";

function home() {
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');
  const [currentLang, setCurrentLang] = useState('en');

  // Detect language
  useEffect(() => {
    const checkLanguage = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        setCurrentLang(select.value || 'en');
      }
    };

    checkLanguage();
    const interval = setInterval(checkLanguage, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <main class="main-page">
        <div class="wrap">
          <article class="container">
            <section class="forecasts">
              <div class="forecasts__header fl">
                <div class="section-title">{replaceTranslation('Predictions', currentLang)}</div>
                <div class="date-setting">
                  <button>
                    <span
                      onClick={() => setSelectedDateFilter('all')}
                      class={`date-setting__link by-ajax ${selectedDateFilter === 'all' ? 'current' : ''}`}
                    >
                      {replaceTranslation('All Predictions', currentLang)}
                    </span>
                  </button>
                  <button>
                    <span
                      onClick={() => setSelectedDateFilter('today')}
                      class={`date-setting__link by-ajax ${selectedDateFilter === 'today' ? 'current' : ''}`}
                    >
                      {replaceTranslation('Today', currentLang)}
                    </span>
                  </button>
                  <button>
                    <span
                      onClick={() => setSelectedDateFilter('tomorrow')}
                      class={`date-setting__link by-ajax ${selectedDateFilter === 'tomorrow' ? 'current' : ''}`}
                    >
                      {replaceTranslation('Tomorrow', currentLang)}
                    </span>
                  </button>
                </div>
              </div>

              <DynamicForecasts dateFilter={selectedDateFilter} />

            </section>


            <section class="overall-content">
              <h1>{replaceTranslation('Betting Tips and Sure Predictions for Sports', currentLang)}</h1>
              <p>
                {replaceTranslation('With the recent popularity of online sports betting, it has become a lot easier and more convenient. There is a wide range of sports to bet on, such as football (soccer), basketball, tennis, baseball, hockey, etc. To increase chances of winning, many bettors rely on betting tips — expert insights and match analyses that guide smarter wagering decisions.', currentLang)}
              </p>
              <h2>{replaceTranslation('What We Offer on Livebaz – Sure Betting Tips Site', currentLang)}</h2>
              <p>
                {replaceTranslation('Websites with sports betting tips and predictions provide valuable insights and recommendations to help bettors make more educated and potentially profitable wagers. These tips are based on various factors such as statistical analysis, team/player performance, historical data, and other relevant information. Livebaz is recognized as one of the best prediction sites for football, offering reliable forecasts.', currentLang)}
              </p>
              <h3>{replaceTranslation('The Right Place to Look for Football Betting Tips', currentLang)}</h3>
              <p>
                {replaceTranslation('Football, the world\'s most popular sport, draws millions into thrilling matches and dynamic play. Against the backdrop of each unfolding game, bettors seek guidance from various football prediction websites for winning tips.', currentLang)}
              </p>
              <p>
                {replaceTranslation('Besides a general preview of the match, sharp punters are looking for the best odds and bets, as well as reliable sure tips to increase their chances of success. We understand the need for a one-stop tool to compare the most compatible odds across betting sites to multiply your winnings. That’s where Livebaz comes in, our goal is to equip you with the most valuable information, ensuring you make thought-out decisions.', currentLang)}
              </p>
              <p>{replaceTranslation('We give you odds line movement on:', currentLang)}</p>
              <ul>
                <li>
                  <a href="#/football/goals-over-under/">
                    {replaceTranslation('Under/Over 2.5 Betting Tips', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Take advantage of expert Over/Under 2.5 goals predictions for today\'s football matches. Our betting tips give punters smart goal line advice and highlight the best odds to help boost their returns.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/football/btts/">
                    {replaceTranslation('Both Teams to Score Tips', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Our BTTS predictions are designed to identify matches where both teams are likely to score. These betting tips for today’s games give you the edge in making successful bets, as they’re ideal for matches with evenly matched teams or attacking styles, offering strong value even in unpredictable games.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/football/half-full-time/">
                    {replaceTranslation('HT/FT Tips', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Half-Time/Full-Time predictions provide insights on halftime and fulltime outcomes, offering more nuanced betting opportunities. These detailed betting tips help you capture value by understanding game dynamics throughout the match.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/football/asian-handicap/">
                    {replaceTranslation('Asian Handicap Betting Tips', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Asian handicap predictions offer balanced betting options by considering team strengths and match conditions. Our betting tips on Asian handicap markets help you spot value bets and reduce risks.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/football/corners-over-under/">
                    {replaceTranslation('Corners Betting Tips Today', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Corner betting tips focus on predicting the number of corner kicks during a match, offering great value for stats-driven bettors. Our corner betting predictions can help you spot profitable opportunities that are often overlooked by bookmakers.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/football/double-chance/">
                    {replaceTranslation('Double Chance Betting Tips', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Double chance predictions naturally boost your chances of winning by covering two possible outcomes – ideal for reducing risk, especially in tight or unpredictable matches. You get better coverage, more stability in your bets, and increased consistency over time.', currentLang)}
              </p>
              <h2>{replaceTranslation('Win Probability and Betting Odds', currentLang)}</h2>
              <p>
                {replaceTranslation('You, as a bettor analyse and interpret the odds to determine the potential value of a bet and to assess the potential risk and reward. Higher odds indicate a lower perceived probability of an outcome, while lower odds suggest a higher perceived likelihood. Understanding how to read and interpret odds is essential for successful sports betting.', currentLang)}
              </p>
              <p>
                {replaceTranslation('We at Livebaz made betting even easier, going beyond basic mathematical football predictions, by comparing implied probabilities with historical team performance under similar odds.', currentLang)}
              </p>
              <p>
                {replaceTranslation('We show how often a comparable odd has won in the past. This insight helps bettors determine if a bookmaker’s implied probability aligns with real outcomes or if a gap suggests a potential value bet.', currentLang)}
              </p>
              <h2>
                {replaceTranslation('How Can Sure Win Prediction Today Boost Your Betting Game?', currentLang)}
              </h2>
              <p>
                {replaceTranslation('Our detailed match predictions at Livebaz provide bettors with in-depth analysis, expert insights, and valuable tips to support smarter wagering decisions. As a trusted betting tips site, we combine statistical data with professional opinions to deliver accurate predictions that help players boost their chances of placing successful and profitable bets.', currentLang)}
              </p>
              <p>{replaceTranslation('Here\'s how our betting tips site can help:', currentLang)}</p>
              <ul>
                <li>
                  <strong>{replaceTranslation('Access to Expertise:', currentLang)} </strong>{replaceTranslation('Livebaz as a prediction site employs sports betting professionals who leverage their expertise to analyse various factors like team performance, player form, head-to-head records, and other relevant data to make informed match previews.', currentLang)}
                </li>
                <li>
                  <strong>{replaceTranslation('Time-Saving and Convenience:', currentLang)}</strong> {replaceTranslation('For bettors who may not have the time or resources to conduct in-depth research themselves, Livebaz can be a convenient solution, saving time and effort in gathering and analysing data from multiple sources.', currentLang)}
                </li>
                <li>
                  <strong>{replaceTranslation('Statistical Analysis and Trends:', currentLang)}</strong> {replaceTranslation('Our prediction site uses statistical models and historical data to identify patterns, trends, and statistical insights that may be relevant to upcoming matches.', currentLang)}
                </li>
                <li>
                  <strong>{replaceTranslation('Information and Insights:', currentLang)} </strong>{replaceTranslation('Livebaz provides access to information about standings, players, injuries, past data on head-to-head matches, and other factors that may impact the outcome of a match. By accessing this information, users can make their personal predictions about the upcoming game.', currentLang)}
                </li>
              </ul>
              <p>
                {replaceTranslation('While free betting predictions can be beneficial, including those labelled as sure win predictions, they should not be blindly followed without any personal assessment or consideration. Bettors should still exercise their judgment, perform their own research, and combine the information provided by tips with their own analysis to make well-informed betting decisions.', currentLang)}
              </p>
              <h2>{replaceTranslation('Expert Predictions Today by Sport', currentLang)}</h2>
              <p>
                {replaceTranslation('When it comes to sports betting, trust is essential. Selecting a winning prediction site, it’s vital to evaluate its credibility, and Livebaz has built a reputation as a reliable source with expert football predictions, including sure tips that many bettors rely on. But no one is ideal, and on our website you can see a solid track record of accuracy, demonstrating transparency by showing both successful and unsuccessful predictions.', currentLang)}
              </p>
              <p>
                {replaceTranslation('You can see the expertise of our analysts through their predictions — they don’t present just raw data but also give the reasoning, helping users see the logic behind each bet.', currentLang)}
              </p>
              <p>
                {replaceTranslation('While betting prediction cannot guarantee 100% accuracy, our analysts’ data-driven approach increases the chances of making profitable bets through consistent winning tips and in-depth match evaluations.', currentLang)}
              </p>
              <p>
                {replaceTranslation('Our team at Livebaz works daily to deliver expert sports predictions that help both beginner and seasoned bettors make smarter, more profitable betting decisions. We specialize in football betting tips, sure win predictions, and value bets across a wide range of sports and leagues worldwide.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/predictions/">
                    {replaceTranslation('Today\'s top sports predictions', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Explore our top sports predictions covering football, basketball, tennis for today and tomorrow. Our expert sports betting tips offer you valuable guidance across multiple sports.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/predictions/football/">
                    {replaceTranslation('Today\'s accurate football predictions', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Our today\'s football predictions are backed by thorough expert analysis. Our football match previews and betting tips help you make knowledgeable wagers on top football matches.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/predictions/basketball/">
                    {replaceTranslation('Basketball Predictions Today', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Basketball predictions section, our experts share in-depth knowledge of the game. These aim to maximize your winnings by providing confident and reliable picks for today’s basketball matches.', currentLang)}
              </p>
              <ul>
                <li>
                  <a href="#/predictions/tennis/">
                    {replaceTranslation('Tennis Predictions', currentLang)}
                  </a>
                </li>
              </ul>
              <p>
                {replaceTranslation('Expert tennis predictions based on player form, surface type, and head-to-head stats. The use of them increases your chances of winning tennis bets.', currentLang)}
              </p>
              <p>
                {replaceTranslation('Whether you want predictions for today, tomorrow or any day of the week, we have you covered!', currentLang)}
              </p>
            </section>
          </article>
        </div>
      </main>

      <div class="popups__auth">
        <div class="user-popup" data-url="/auth-forms/"></div>
      </div>

      <div class="cover hidden"></div>
    </>
  );
}

export default home;
