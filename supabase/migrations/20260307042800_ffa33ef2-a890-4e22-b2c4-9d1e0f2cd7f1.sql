
-- Update Climate Fundamentals - Text lesson
UPDATE lesson_content SET 
  title = 'Understanding Earth''s Climate System',
  content = '{
    "description": "Earth''s climate system is a complex interaction between the atmosphere, hydrosphere, cryosphere, lithosphere, and biosphere. The Sun is the primary energy source driving all weather and climate processes. About 30% of incoming solar radiation is reflected back to space by clouds, aerosols, and Earth''s surface (albedo effect), while the remaining 70% is absorbed and heats the planet. The greenhouse effect, where gases like CO₂, CH₄, and H₂O trap outgoing infrared radiation, maintains Earth''s average temperature at approximately 15°C — without it, Earth would be a frozen -18°C. Climate differs from weather: weather describes short-term atmospheric conditions, while climate represents the statistical average of weather over 30+ years. Key climate zones include tropical, arid, temperate, continental, and polar, each defined by temperature and precipitation patterns.",
    "key_points": [
      "The greenhouse effect raises Earth''s temperature by ~33°C, making it habitable",
      "Milankovitch cycles (orbital variations) drive ice age cycles over 10,000-100,000 year periods",
      "Ocean currents like the thermohaline circulation redistribute heat globally — the Atlantic Meridional Overturning Circulation (AMOC) moves warm water northward",
      "The Keeling Curve shows CO₂ levels have risen from 280 ppm (pre-industrial) to over 420 ppm today",
      "Albedo feedback: melting ice exposes darker surfaces, absorbing more heat and accelerating warming",
      "Reference: IPCC Sixth Assessment Report (2021-2023) — https://www.ipcc.ch/assessment-report/ar6/",
      "Wikipedia: Earth''s Climate System — https://en.wikipedia.org/wiki/Climate_system"
    ]
  }'::jsonb
WHERE id = '7fb9748f-38ce-41d0-b1a7-2408217c1dc8';

-- Update Climate Fundamentals - Video lesson
UPDATE lesson_content SET 
  title = 'How Earth''s Climate Works - NASA Visualization',
  content = '{
    "description": "Watch NASA''s comprehensive explanation of Earth''s climate system, including atmospheric circulation, ocean currents, and the carbon cycle. This video uses real satellite data to visualize global heat distribution and climate patterns.",
    "video_url": "https://www.youtube.com/embed/oJAbATJCugs",
    "key_points": [
      "NASA Climate Change Portal — https://climate.nasa.gov/",
      "NOAA Climate.gov Educational Resources — https://www.climate.gov/teaching",
      "Khan Academy: Earth''s Climate — https://www.khanacademy.org/science/cosmology-and-astronomy"
    ]
  }'::jsonb
WHERE id = '02881209-17a2-4c61-81c0-0094560028c0';

-- Update Climate Fundamentals - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Climate Science Fundamentals',
  content = '{
    "questions": [
      {
        "question": "What is the approximate average surface temperature of Earth due to the greenhouse effect?",
        "options": ["-18°C", "0°C", "15°C", "30°C"],
        "correct_index": 2
      },
      {
        "question": "Which gas is the most abundant greenhouse gas in Earth''s atmosphere?",
        "options": ["Carbon Dioxide (CO₂)", "Methane (CH₄)", "Water Vapor (H₂O)", "Nitrous Oxide (N₂O)"],
        "correct_index": 2
      },
      {
        "question": "What percentage of incoming solar radiation is reflected back to space?",
        "options": ["10%", "30%", "50%", "70%"],
        "correct_index": 1
      },
      {
        "question": "What is the current atmospheric CO₂ concentration (approximate)?",
        "options": ["280 ppm", "350 ppm", "420 ppm", "500 ppm"],
        "correct_index": 2
      },
      {
        "question": "Which ocean circulation pattern is critical for distributing heat in the Atlantic?",
        "options": ["El Niño-Southern Oscillation", "Atlantic Meridional Overturning Circulation (AMOC)", "Pacific Decadal Oscillation", "Indian Ocean Dipole"],
        "correct_index": 1
      }
    ]
  }'::jsonb
WHERE id = '6a25ac48-dd64-4f76-bac4-6d38a041ea8b';

-- Weather Pattern Analysis - Text
UPDATE lesson_content SET 
  title = 'Understanding Weather Systems & Patterns',
  content = '{
    "description": "Weather patterns are driven by the uneven heating of Earth''s surface, creating pressure differences that generate wind and precipitation. High-pressure systems (anticyclones) bring clear, stable weather, while low-pressure systems (cyclones) bring clouds and storms. The Coriolis effect, caused by Earth''s rotation, deflects moving air — rightward in the Northern Hemisphere, leftward in the Southern — creating the characteristic spiral patterns of weather systems. Fronts occur where different air masses meet: cold fronts bring sudden temperature drops with intense but brief precipitation; warm fronts bring gradual warming with prolonged light rain. Jet streams — fast-flowing air currents at 9-12 km altitude — steer weather systems and significantly influence regional climate. Understanding synoptic meteorology (large-scale weather analysis) requires interpreting surface pressure maps, upper-air charts, and satellite imagery together.",
    "key_points": [
      "The Hadley, Ferrel, and Polar cells create Earth''s major wind belts and precipitation zones",
      "El Niño-Southern Oscillation (ENSO) affects global weather — El Niño warms the central Pacific, altering jet streams worldwide",
      "Convective storms form when warm, moist air rises rapidly — severe thunderstorms require wind shear, instability, moisture, and a lifting mechanism",
      "Tropical cyclones (hurricanes/typhoons) need sea surface temperatures above 26.5°C and low wind shear to form",
      "Numerical Weather Prediction (NWP) models like GFS and ECMWF use millions of equations to forecast weather up to 16 days ahead",
      "Research: ECMWF Forecasting — https://www.ecmwf.int/en/forecasts",
      "Wikipedia: Weather Forecasting — https://en.wikipedia.org/wiki/Weather_forecasting"
    ]
  }'::jsonb
WHERE id = 'fb43ba4e-4453-4e03-9f9d-97e145f7b698';

-- Weather Pattern Analysis - Video
UPDATE lesson_content SET 
  title = 'Weather Patterns Explained - National Geographic',
  content = '{
    "description": "Explore how weather patterns form, move, and interact through this detailed visualization. Learn about frontal systems, jet streams, and how meteorologists use satellite data and computer models to predict weather.",
    "video_url": "https://www.youtube.com/embed/dwUrdG4bImc",
    "key_points": [
      "NOAA Weather Prediction Center — https://www.wpc.ncep.noaa.gov/",
      "National Weather Service Education — https://www.weather.gov/education",
      "Research Paper: Advances in Weather Forecasting (Nature) — https://www.nature.com/subjects/weather"
    ]
  }'::jsonb
WHERE id = '2f725465-73b8-41c0-9656-67e0660b18d7';

-- Weather Pattern Analysis - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Weather Systems & Forecasting',
  content = '{
    "questions": [
      {
        "question": "What minimum sea surface temperature is required for tropical cyclone formation?",
        "options": ["20°C", "23°C", "26.5°C", "30°C"],
        "correct_index": 2
      },
      {
        "question": "In which direction does the Coriolis effect deflect air in the Northern Hemisphere?",
        "options": ["Left", "Right", "Upward", "No deflection"],
        "correct_index": 1
      },
      {
        "question": "Which weather model is operated by the European Centre for Medium-Range Weather Forecasts?",
        "options": ["GFS", "NAM", "ECMWF/IFS", "WRF"],
        "correct_index": 2
      },
      {
        "question": "What type of front brings sudden temperature drops with intense but brief precipitation?",
        "options": ["Warm front", "Cold front", "Stationary front", "Occluded front"],
        "correct_index": 1
      }
    ]
  }'::jsonb
WHERE id = '0ae30dc7-3ceb-40e0-90ca-7c0850967b24';

-- AI in Environmental Science - Text
UPDATE lesson_content SET 
  title = 'Machine Learning for Environmental Monitoring',
  content = '{
    "description": "Artificial Intelligence is revolutionizing environmental science by processing vast datasets that humans cannot analyze manually. Satellite remote sensing generates petabytes of Earth observation data daily — AI models including Convolutional Neural Networks (CNNs) and transformers can classify land cover, detect deforestation, identify wildfire hotspots, and track urban sprawl from this imagery. Google''s DeepMind developed a model that predicts wind power output 36 hours ahead with 30% higher accuracy than physical models. NASA''s GEDI mission uses LiDAR data processed by machine learning to create 3D maps of forest canopy, measuring biomass and carbon storage. For anomaly detection, autoencoders and isolation forests identify unusual environmental patterns — TerraGuardians uses similar techniques to detect environmental anomalies in real-time from multi-source data streams.",
    "key_points": [
      "Random Forests and Gradient Boosting are widely used for environmental classification tasks like land use mapping",
      "Recurrent Neural Networks (RNNs/LSTMs) excel at time-series predictions — river discharge, air quality, and temperature forecasting",
      "Transfer learning allows pre-trained models (e.g., on ImageNet) to classify satellite imagery with limited training data",
      "Google Earth Engine provides a planetary-scale platform for geospatial analysis using cloud computing",
      "Challenges include data quality, spatial/temporal resolution gaps, and model interpretability in policy decisions",
      "Research: Machine Learning for Climate (Nature Climate Change) — https://www.nature.com/nclimate/",
      "Google Earth Engine — https://earthengine.google.com/"
    ]
  }'::jsonb
WHERE id = '83452989-734f-418a-9729-e2094322b51e';

-- AI in Environmental Science - Video
UPDATE lesson_content SET 
  title = 'AI & Climate Science - How AI Fights Climate Change',
  content = '{
    "description": "Discover how artificial intelligence and machine learning are being used to combat climate change, from optimizing renewable energy grids to predicting extreme weather events and monitoring deforestation from space.",
    "video_url": "https://www.youtube.com/embed/NQ2mfFiXlnI",
    "key_points": [
      "Google DeepMind Climate Research — https://deepmind.google/discover/blog/?category=Climate",
      "NASA Earthdata — https://earthdata.nasa.gov/",
      "Wikipedia: AI in Environmental Science — https://en.wikipedia.org/wiki/Artificial_intelligence_in_environmental_science"
    ]
  }'::jsonb
WHERE id = '11fb1305-fdcc-4f60-be58-d7d373ac85f8';

-- AI in Environmental Science - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: AI & Environmental Applications',
  content = '{
    "questions": [
      {
        "question": "Which type of neural network is most commonly used for satellite image classification?",
        "options": ["Recurrent Neural Network (RNN)", "Convolutional Neural Network (CNN)", "Generative Adversarial Network (GAN)", "Boltzmann Machine"],
        "correct_index": 1
      },
      {
        "question": "What does NASA''s GEDI mission measure using LiDAR?",
        "options": ["Ocean temperature", "Forest canopy height and biomass", "Atmospheric CO₂", "Soil moisture"],
        "correct_index": 1
      },
      {
        "question": "Which platform provides planetary-scale geospatial analysis in the cloud?",
        "options": ["ArcGIS Online", "Google Earth Engine", "QGIS Cloud", "MapBox Studio"],
        "correct_index": 1
      },
      {
        "question": "What technique allows pre-trained models to work on new tasks with limited data?",
        "options": ["Reinforcement learning", "Transfer learning", "Unsupervised clustering", "Feature engineering"],
        "correct_index": 1
      }
    ]
  }'::jsonb
WHERE id = 'feaf3c09-cdbe-40eb-92b3-f0a49c93c5da';

-- Satellite Data Interpretation - Text
UPDATE lesson_content SET 
  title = 'Reading & Interpreting Satellite Imagery',
  content = '{
    "description": "Earth observation satellites capture data across multiple electromagnetic spectrum bands, far beyond what human eyes can see. Multispectral sensors like Landsat-8/9 capture 11 bands from visible to thermal infrared, while hyperspectral sensors capture hundreds of narrow bands. The Normalized Difference Vegetation Index (NDVI) — calculated as (NIR - Red)/(NIR + Red) — is the most widely used vegetation health indicator. Values near +1 indicate dense, healthy vegetation; values near 0 indicate bare soil; negative values indicate water. Synthetic Aperture Radar (SAR), used by Sentinel-1, penetrates clouds and works day/night, making it invaluable for monitoring floods, deforestation, and ground subsidence. Spatial resolution ranges from 30cm (commercial) to 1km (weather satellites), while temporal resolution (revisit time) varies from daily to 16 days.",
    "key_points": [
      "Landsat provides the longest continuous satellite record of Earth — since 1972, with 30m resolution",
      "Sentinel-2 offers 10m resolution with 5-day revisit time and 13 spectral bands — excellent for agriculture and forestry",
      "Thermal infrared bands detect urban heat islands, volcanic activity, and wildfire hotspots",
      "False-color composites reveal features invisible to the naked eye — e.g., NIR-Red-Green shows vegetation in bright red",
      "MODIS (on Terra & Aqua satellites) provides daily global coverage at 250m-1km resolution for atmospheric and land monitoring",
      "USGS Earth Explorer — https://earthexplorer.usgs.gov/",
      "ESA Copernicus Data Hub — https://scihub.copernicus.eu/"
    ]
  }'::jsonb
WHERE id = 'c7f138c8-10f5-4b19-b6b7-e591163361c6';

-- Satellite Data Interpretation - Video
UPDATE lesson_content SET 
  title = 'How Satellites See Earth - NASA Goddard',
  content = '{
    "description": "NASA Goddard Space Flight Center explains how different satellite instruments capture data about Earth''s atmosphere, oceans, and land surfaces. Learn about spectral bands, resolution types, and how scientists process raw satellite data into meaningful environmental information.",
    "video_url": "https://www.youtube.com/embed/xPbCIeRI7K0",
    "key_points": [
      "NASA Worldview — https://worldview.earthdata.nasa.gov/",
      "USGS Landsat Missions — https://www.usgs.gov/landsat-missions",
      "Wikipedia: Remote Sensing — https://en.wikipedia.org/wiki/Remote_sensing"
    ]
  }'::jsonb
WHERE id = '09144b27-b5b3-448c-9094-357abb004e27';

-- Satellite Data Interpretation - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Satellite Remote Sensing',
  content = '{
    "questions": [
      {
        "question": "What does NDVI measure?",
        "options": ["Temperature", "Vegetation health", "Air pressure", "Humidity"],
        "correct_index": 1
      },
      {
        "question": "Which satellite sensor type can penetrate clouds and work at night?",
        "options": ["Visible light camera", "Thermal infrared sensor", "Synthetic Aperture Radar (SAR)", "Multispectral scanner"],
        "correct_index": 2
      },
      {
        "question": "What is the spatial resolution of Landsat-8 imagery?",
        "options": ["1 meter", "10 meters", "30 meters", "250 meters"],
        "correct_index": 2
      },
      {
        "question": "Since what year has the Landsat program been continuously imaging Earth?",
        "options": ["1960", "1972", "1985", "1999"],
        "correct_index": 1
      }
    ]
  }'::jsonb
WHERE id = '36648dae-5091-474c-836a-934e96e5330d';

-- Ocean & Marine Systems - Text
UPDATE lesson_content SET 
  title = 'Ocean Circulation & Marine Ecosystems',
  content = '{
    "description": "Oceans cover 71% of Earth''s surface and play a critical role in regulating climate by absorbing 93% of excess heat and 30% of anthropogenic CO₂. The thermohaline circulation (global ocean conveyor belt) is driven by differences in water density caused by temperature and salinity variations. In the North Atlantic, cold, salty water sinks to the deep ocean and flows southward, while warm surface water flows northward — this cycle takes roughly 1,000 years to complete. Ocean acidification, caused by CO₂ absorption lowering pH from 8.2 to ~8.1 since pre-industrial times, threatens coral reefs, shellfish, and marine food chains. Coral bleaching events, triggered by ocean temperatures rising just 1-2°C above normal, have devastated the Great Barrier Reef. Phytoplankton, microscopic marine plants, produce approximately 50% of Earth''s oxygen through photosynthesis.",
    "key_points": [
      "The ocean has absorbed about 525 billion tons of CO₂ from the atmosphere since the industrial revolution",
      "Sea level is rising at ~3.6mm/year due to thermal expansion and ice sheet melting",
      "Marine Protected Areas (MPAs) cover only ~8% of the ocean — scientists recommend at least 30% by 2030",
      "Upwelling zones where deep, nutrient-rich water rises to the surface support the world''s most productive fisheries",
      "Dead zones (hypoxic areas) caused by nutrient pollution have increased from 49 in the 1960s to over 700 today",
      "NOAA Ocean Service — https://oceanservice.noaa.gov/",
      "Research: State of the Ocean Report — https://www.nature.com/subjects/ocean-sciences"
    ]
  }'::jsonb
WHERE id = 'fd4fc3c1-5a95-42f2-9d87-2cf0f110db97';

-- Ocean & Marine Systems - Video
UPDATE lesson_content SET 
  title = 'Ocean Currents & Climate - NOAA',
  content = '{
    "description": "Explore the deep connection between ocean currents and global climate. This NOAA visualization shows how the thermohaline circulation distributes heat worldwide and why changes in ocean circulation can trigger dramatic climate shifts.",
    "video_url": "https://www.youtube.com/embed/p4pWafuvdrY",
    "key_points": [
      "NOAA Ocean Exploration — https://oceanexplorer.noaa.gov/",
      "Schmidt Ocean Institute — https://schmidtocean.org/",
      "Wikipedia: Ocean Current — https://en.wikipedia.org/wiki/Ocean_current"
    ]
  }'::jsonb
WHERE id = 'c60bcfef-5724-4ec1-9611-28aebb6cef95';

-- Ocean & Marine Systems - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Ocean Science & Marine Systems',
  content = '{
    "questions": [
      {
        "question": "What percentage of excess heat from global warming has the ocean absorbed?",
        "options": ["50%", "70%", "93%", "30%"],
        "correct_index": 2
      },
      {
        "question": "What drives the thermohaline (global conveyor belt) circulation?",
        "options": ["Wind patterns", "Tidal forces", "Density differences from temperature and salinity", "Earth''s rotation"],
        "correct_index": 2
      },
      {
        "question": "Approximately what percentage of Earth''s oxygen do phytoplankton produce?",
        "options": ["10%", "25%", "50%", "75%"],
        "correct_index": 2
      },
      {
        "question": "What is the current rate of sea level rise per year?",
        "options": ["~1mm", "~2mm", "~3.6mm", "~10mm"],
        "correct_index": 2
      }
    ]
  }'::jsonb
WHERE id = '1bad64f8-430f-487f-b1bf-955620c71a3b';

-- Disaster Preparedness - Text
UPDATE lesson_content SET 
  title = 'Natural Disaster Risk Assessment & Response',
  content = '{
    "description": "Natural disasters kill approximately 60,000 people annually and cause over $300 billion in damages globally. Effective disaster preparedness involves understanding hazard types, vulnerability assessment, early warning systems, and response planning. The Sendai Framework for Disaster Risk Reduction (2015-2030) prioritizes understanding risk, strengthening governance, investing in resilience, and enhancing preparedness. Modern early warning systems combine satellite monitoring, ground sensors, AI prediction models, and rapid communication networks. For earthquakes, the ShakeAlert system in the western US can provide seconds to minutes of warning before shaking arrives. Tsunami warning systems use deep-ocean pressure sensors (DART buoys) to detect waves traveling at up to 800 km/h across open ocean. Wildfire risk assessment uses fuel moisture content, wind patterns, topography, and historical fire data.",
    "key_points": [
      "The Richter scale is logarithmic — each whole number increase represents 10× more ground motion and ~31.6× more energy",
      "Category 5 hurricanes have sustained winds exceeding 252 km/h (157 mph)",
      "FEMA recommends every household have a 72-hour emergency supply kit with water (1 gallon/person/day), food, medications, and documents",
      "Community Early Warning Systems (CEWS) reduce disaster mortality by up to 80% when properly implemented",
      "Climate change is increasing the frequency and intensity of extreme weather events — heat waves, floods, and wildfires",
      "FEMA Ready.gov — https://www.ready.gov/",
      "UNDRR Sendai Framework — https://www.undrr.org/implementing-sendai-framework"
    ]
  }'::jsonb
WHERE id = '5caf4d3d-82b3-4389-bcfb-3a3b8a6fe9e5';

-- Disaster Preparedness - Video
UPDATE lesson_content SET 
  title = 'How Early Warning Systems Save Lives',
  content = '{
    "description": "Learn how modern early warning systems detect and alert communities about incoming natural disasters. From seismic networks to satellite-based flood forecasting, see the technology that saves thousands of lives every year.",
    "video_url": "https://www.youtube.com/embed/z2LseRXlnQk",
    "key_points": [
      "USGS Earthquake Hazards Program — https://earthquake.usgs.gov/",
      "National Hurricane Center — https://www.nhc.noaa.gov/",
      "Wikipedia: Disaster Preparedness — https://en.wikipedia.org/wiki/Disaster_preparedness"
    ]
  }'::jsonb
WHERE id = '8f0b5b24-1ffc-4fe2-b7a6-fad209f23a05';

-- Disaster Preparedness - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Disaster Science & Preparedness',
  content = '{
    "questions": [
      {
        "question": "How many days of emergency supplies does FEMA recommend every household maintain?",
        "options": ["1 day", "3 days (72 hours)", "7 days", "14 days"],
        "correct_index": 1
      },
      {
        "question": "What type of sensor detects tsunamis in deep ocean?",
        "options": ["Weather buoy", "DART buoy (deep-ocean pressure sensor)", "GPS satellite", "Tide gauge"],
        "correct_index": 1
      },
      {
        "question": "By how much can early warning systems reduce disaster mortality?",
        "options": ["Up to 30%", "Up to 50%", "Up to 80%", "100%"],
        "correct_index": 2
      },
      {
        "question": "What minimum wind speed defines a Category 5 hurricane?",
        "options": ["178 km/h", "209 km/h", "252 km/h", "300 km/h"],
        "correct_index": 2
      }
    ]
  }'::jsonb
WHERE id = '86c64713-089e-4871-87c0-b2e6d0327f29';

-- Polar Climate Dynamics - Text
UPDATE lesson_content SET 
  title = 'Arctic & Antarctic Climate Systems',
  content = '{
    "description": "The polar regions are warming 2-4 times faster than the global average — a phenomenon called Arctic amplification. The Arctic sea ice extent has declined by approximately 13% per decade since 1979, with September minimums reaching record lows. This ice loss triggers a powerful positive feedback: as white ice melts, darker ocean water absorbs more solar radiation, accelerating further warming. Greenland''s ice sheet contains enough ice to raise global sea levels by ~7.4 meters if fully melted, and is currently losing approximately 270 billion tons of ice annually. In Antarctica, the West Antarctic Ice Sheet is considered particularly vulnerable, with potential for 3-5 meters of sea level rise. Permafrost (permanently frozen ground) across the Arctic stores approximately 1,500 gigatons of organic carbon — twice the amount currently in Earth''s atmosphere. As permafrost thaws, it releases CO₂ and methane, creating another dangerous feedback loop.",
    "key_points": [
      "Arctic sea ice reached its lowest recorded extent in September 2012 — 3.41 million km², compared to the 1979-2000 average of 6.7 million km²",
      "The Antarctic ozone hole, caused primarily by CFCs, has been slowly recovering since the 1987 Montreal Protocol",
      "Polar bears depend on sea ice for hunting — their habitat is projected to shrink by 40% by 2050",
      "Permafrost thaw could release 50-100 gigatons of carbon by 2100, equivalent to 10-20 years of current fossil fuel emissions",
      "The polar vortex — a band of cold air circling the Arctic — can destabilize and send Arctic air southward, causing extreme winter weather",
      "NASA Arctic Research — https://climate.nasa.gov/explore/ask-nasa-climate/3270/arctic-sea-ice/",
      "National Snow and Ice Data Center — https://nsidc.org/"
    ]
  }'::jsonb
WHERE id = '83cbfdf6-ee25-469c-abb4-e3e700327350';

-- Polar Climate Dynamics - Video
UPDATE lesson_content SET 
  title = 'The Melting Arctic - NASA Climate',
  content = '{
    "description": "NASA visualizes decades of Arctic sea ice decline using satellite data, showing the dramatic transformation of polar regions. Understand how ice loss impacts global sea levels, weather patterns, and ecosystems worldwide.",
    "video_url": "https://www.youtube.com/embed/hlVXOC9v6-U",
    "key_points": [
      "National Snow and Ice Data Center — https://nsidc.org/",
      "British Antarctic Survey — https://www.bas.ac.uk/",
      "Wikipedia: Arctic Sea Ice Decline — https://en.wikipedia.org/wiki/Arctic_sea_ice_decline"
    ]
  }'::jsonb
WHERE id = '510bdffc-9cce-48b9-839e-1f080d09a2fb';

-- Polar Climate Dynamics - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Polar Science & Cryosphere',
  content = '{
    "questions": [
      {
        "question": "How much faster are polar regions warming compared to the global average?",
        "options": ["1.5 times", "2-4 times", "5-6 times", "10 times"],
        "correct_index": 1
      },
      {
        "question": "How much would global sea levels rise if Greenland''s entire ice sheet melted?",
        "options": ["~1 meter", "~3 meters", "~7.4 meters", "~15 meters"],
        "correct_index": 2
      },
      {
        "question": "How much carbon is stored in Arctic permafrost?",
        "options": ["~500 gigatons", "~1,000 gigatons", "~1,500 gigatons", "~3,000 gigatons"],
        "correct_index": 2
      },
      {
        "question": "Which international agreement successfully addressed the ozone hole?",
        "options": ["Kyoto Protocol", "Paris Agreement", "Montreal Protocol", "Vienna Convention"],
        "correct_index": 2
      }
    ]
  }'::jsonb
WHERE id = 'a759d20c-9ca7-4120-abd4-6218ca1b3919';

-- Solar & Space Weather - Text
UPDATE lesson_content SET 
  title = 'Solar Activity & Its Effects on Earth',
  content = '{
    "description": "The Sun''s activity follows an approximately 11-year solar cycle, oscillating between solar minimum (few sunspots) and solar maximum (many sunspots, increased flares). Solar flares — sudden releases of electromagnetic energy — can reach Earth in 8 minutes, while Coronal Mass Ejections (CMEs) — massive bursts of solar wind and magnetic field — take 1-3 days to arrive. When CMEs interact with Earth''s magnetosphere, they cause geomagnetic storms that produce beautiful auroras but can also damage satellites, disrupt GPS, affect radio communications, and even overload power grids. The Carrington Event of 1859 was the most powerful recorded geomagnetic storm — a similar event today could cause trillions of dollars in damage to modern technological infrastructure. Space weather monitoring by NASA''s Solar Dynamics Observatory (SDO) and ESA''s Solar Orbiter provides crucial advance warning of potentially harmful solar events.",
    "key_points": [
      "The current Solar Cycle 25 began in December 2019 and is expected to peak around 2024-2025",
      "The solar wind streams outward at 300-800 km/s, carrying charged particles that interact with Earth''s magnetic field",
      "The Van Allen radiation belts trap charged particles and protect Earth''s surface from harmful solar radiation",
      "A Carrington-level event today could cause $1-2 trillion in damages and leave regions without power for months",
      "Total Solar Irradiance (TSI) varies by only ~0.1% over the solar cycle — too small to explain recent global warming",
      "NOAA Space Weather Prediction Center — https://www.swpc.noaa.gov/",
      "NASA Solar Dynamics Observatory — https://sdo.gsfc.nasa.gov/"
    ]
  }'::jsonb
WHERE id = 'bd281355-7717-41d8-890d-4d4c476bc418';

-- Solar & Space Weather - Video
UPDATE lesson_content SET 
  title = 'Space Weather & Solar Storms - NASA',
  content = '{
    "description": "NASA explains how solar activity affects Earth, from beautiful auroras to potentially devastating geomagnetic storms. See real SDO footage of solar flares and CMEs, and learn how space weather forecasting protects our technology.",
    "video_url": "https://www.youtube.com/embed/oHHSSJDJ4oo",
    "key_points": [
      "SpaceWeather.com — https://spaceweather.com/",
      "NASA Heliophysics — https://science.nasa.gov/heliophysics/",
      "Wikipedia: Space Weather — https://en.wikipedia.org/wiki/Space_weather"
    ]
  }'::jsonb
WHERE id = '3acbfe70-87be-4c0b-9819-9c1d9f05e8f4';

-- Solar & Space Weather - Quiz
UPDATE lesson_content SET 
  title = 'Quiz: Solar & Space Weather Science',
  content = '{
    "questions": [
      {
        "question": "What is the approximate length of the solar cycle?",
        "options": ["5 years", "11 years", "22 years", "50 years"],
        "correct_index": 1
      },
      {
        "question": "How long does light from a solar flare take to reach Earth?",
        "options": ["8 seconds", "8 minutes", "8 hours", "8 days"],
        "correct_index": 1
      },
      {
        "question": "What was the most powerful recorded geomagnetic storm called?",
        "options": ["The Maunder Minimum", "The Carrington Event", "Solar Maximum 1989", "The Bastille Day Event"],
        "correct_index": 1
      },
      {
        "question": "How fast does the solar wind travel?",
        "options": ["30-80 km/s", "300-800 km/s", "3,000-8,000 km/s", "Speed of light"],
        "correct_index": 1
      }
    ]
  }'::jsonb
WHERE id = '5708e099-89cc-431d-b8ed-7a8ae0284691';
