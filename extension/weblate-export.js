/*
  Кнопка-закладка «Выгрузка из Weblate».
  Запускается на странице weblate.wb.ru и работает через текущий вход в Weblate
  (без токена и без установки программ). Это исходник; закладку из него
  собирает build.py в index.html.
  Не использовать однострочные комментарии: код живёт в URL закладки.
*/
(function () {
  if (window.__wlExport) { window.__wlExport.show(); return; }

  var QUERY_ALL = 'state:<translated';
  var QUERY_EMPTY = 'state:empty';

  /* ---------- языки: русские названия и флаги ---------- */
  var FLAGS = {"am": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"am-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"am-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"am-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#am-shadow)\" clip-path=\"url(#am-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#078930\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#FCDD09\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#DA121A\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#0F47AF\"/><circle cx=\"32\" cy=\"24\" r=\"3\" fill=\"#FCDD09\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#am-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ar": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ar-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ar-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ar-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ar-shadow)\" clip-path=\"url(#ar-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#006C35\"/><rect x=\"13\" y=\"20\" width=\"38\" height=\"3\" fill=\"#fff\"/><rect x=\"18\" y=\"25\" width=\"28\" height=\"2\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ar-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "az": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"az-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"az-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"az-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#az-shadow)\" clip-path=\"url(#az-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#00B5E2\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#EF3340\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#509E2F\"/><circle cx=\"29\" cy=\"24\" r=\"7\" fill=\"#fff\"/><circle cx=\"32\" cy=\"24\" r=\"5.8\" fill=\"#EF3340\"/><polygon points=\"35,19 36.7,22 40,22 37.4,24.1 38.3,27.5 35,25.5 31.7,27.5 32.6,24.1 30,22 33.3,22\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#az-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "be": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"be-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"be-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"be-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#be-shadow)\" clip-path=\"url(#be-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"32\" fill=\"#CE1720\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#007C30\"/><rect x=\"0\" y=\"0\" width=\"9\" height=\"48\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#be-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "en": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"en-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"en-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"en-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#en-shadow)\" clip-path=\"url(#en-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#012169\"/><polygon points=\"0,0 8,0 64,40 64,48 56,48 0,8\" fill=\"#fff\"/><polygon points=\"56,0 64,0 64,8 8,48 0,48 0,40\" fill=\"#fff\"/><polygon points=\"0,0 3.5,0 64,44 64,48 60.5,48 0,4\" fill=\"#C8102E\"/><polygon points=\"60.5,0 64,0 64,4 3.5,48 0,48 0,44\" fill=\"#C8102E\"/><rect x=\"26\" y=\"0\" width=\"12\" height=\"48\" fill=\"#fff\"/><rect x=\"0\" y=\"18\" width=\"64\" height=\"12\" fill=\"#fff\"/><rect x=\"29\" y=\"0\" width=\"6\" height=\"48\" fill=\"#C8102E\"/><rect x=\"0\" y=\"21\" width=\"64\" height=\"6\" fill=\"#C8102E\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#en-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "fr": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"fr-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"fr-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"fr-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#fr-shadow)\" clip-path=\"url(#fr-clip)\"><rect x=\"0\" y=\"0\" width=\"21.33\" height=\"48\" fill=\"#0055A4\"/><rect x=\"21.33\" y=\"0\" width=\"21.34\" height=\"48\" fill=\"#fff\"/><rect x=\"42.67\" y=\"0\" width=\"21.33\" height=\"48\" fill=\"#EF4135\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#fr-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "he": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"he-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"he-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"he-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#he-shadow)\" clip-path=\"url(#he-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><rect x=\"0\" y=\"5\" width=\"64\" height=\"7\" fill=\"#0038B8\"/><rect x=\"0\" y=\"36\" width=\"64\" height=\"7\" fill=\"#0038B8\"/><polygon points=\"32,12 40,27 24,27\" fill=\"#0038B8\"/><polygon points=\"32,36 24,21 40,21\" fill=\"#0038B8\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#he-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "hy": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"hy-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"hy-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"hy-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#hy-shadow)\" clip-path=\"url(#hy-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#D90012\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#0033A0\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#F2A800\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#hy-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ka": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ka-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ka-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ka-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ka-shadow)\" clip-path=\"url(#ka-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><rect x=\"27\" y=\"0\" width=\"10\" height=\"48\" fill=\"#E4002B\"/><rect x=\"0\" y=\"19\" width=\"64\" height=\"10\" fill=\"#E4002B\"/><rect x=\"12.5\" y=\"7\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"9\" y=\"10.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"48.5\" y=\"7\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"45\" y=\"10.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"12.5\" y=\"31\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"9\" y=\"34.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"48.5\" y=\"31\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"45\" y=\"34.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ka-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "kk": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"kk-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"kk-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"kk-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#kk-shadow)\" clip-path=\"url(#kk-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#00AFCA\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#FEC50C\"/><polygon points=\"32,7 33.5,12 38,12 34.3,14.5 35.7,19 32,16.3 28.3,19 29.7,14.5 26,12 30.5,12\" fill=\"#FEC50C\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#kk-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ko": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ko-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ko-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ko-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ko-shadow)\" clip-path=\"url(#ko-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#CD2E3A\"/><circle cx=\"34.5\" cy=\"24\" r=\"6\" fill=\"#0047A0\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ko-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ky": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ky-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ky-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ky-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ky-shadow)\" clip-path=\"url(#ky-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#E21F26\"/><circle cx=\"32\" cy=\"24\" r=\"9\" fill=\"#FFD200\"/><circle cx=\"32\" cy=\"24\" r=\"5.5\" fill=\"#E21F26\"/><polygon points=\"32,17 33.5,22 39,22 34.5,25 36,30 32,27 28,30 29.5,25 25,22 30.5,22\" fill=\"#FFD200\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ky-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ru": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ru-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ru-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ru-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ru-shadow)\" clip-path=\"url(#ru-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#fff\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#0039A6\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#D52B1E\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ru-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "sw": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"sw-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"sw-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"sw-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#sw-shadow)\" clip-path=\"url(#sw-clip)\"><polygon points=\"0,0 64,0 0,48\" fill=\"#1EB53A\"/><polygon points=\"64,0 64,48 0,48\" fill=\"#00A3DD\"/><polygon points=\"0,0 64,48 64,42 0,0\" fill=\"#FCD116\"/><polygon points=\"0,6 64,48 64,40 0,0\" fill=\"#000\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#sw-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "tg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"tg-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"tg-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"tg-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#tg-shadow)\" clip-path=\"url(#tg-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#C8102E\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#fff\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#006B3F\"/><circle cx=\"32\" cy=\"24\" r=\"5\" fill=\"#F8D24A\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#tg-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "tr": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"tr-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"tr-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"tr-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#tr-shadow)\" clip-path=\"url(#tr-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#E30A17\"/><circle cx=\"25\" cy=\"24\" r=\"9\" fill=\"#fff\"/><circle cx=\"29\" cy=\"24\" r=\"7\" fill=\"#E30A17\"/><polygon points=\"35,17 36.8,22.1 42,22.1 37.8,25.1 39.4,30 35,27 30.6,30 32.2,25.1 28,22.1 33.2,22.1\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#tr-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "uz": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"uz-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"uz-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"uz-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#uz-shadow)\" clip-path=\"url(#uz-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"10\" fill=\"#0099B5\"/><rect x=\"0\" y=\"10\" width=\"64\" height=\"2\" fill=\"#CE1126\"/><rect x=\"0\" y=\"12\" width=\"64\" height=\"12\" fill=\"#fff\"/><rect x=\"0\" y=\"24\" width=\"64\" height=\"2\" fill=\"#CE1126\"/><rect x=\"0\" y=\"26\" width=\"64\" height=\"22\" fill=\"#1EB53A\"/><circle cx=\"8\" cy=\"6\" r=\"3.3\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#uz-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "zh": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"zh-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"zh-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"zh-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#zh-shadow)\" clip-path=\"url(#zh-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#DE2910\"/><circle cx=\"11\" cy=\"10\" r=\"5\" fill=\"#DE2910\"/><polygon points=\"18,3.5 18.8,5.3 20.7,5.3 19.2,6.5 19.8,8.5 18,7.3 16.2,8.5 16.8,6.5 15.3,5.3 17.2,5.3\" fill=\"#DE2910\"/><polygon points=\"20,8.5 20.8,10.3 22.7,10.3 21.2,11.5 21.8,13.5 20,12.3 18.2,13.5 18.8,11.5 17.3,10.3 19.2,10.3\" fill=\"#DE2910\"/><polygon points=\"20,14.5 20.8,16.3 22.7,16.3 21.2,17.5 21.8,19.5 20,18.3 18.2,19.5 18.8,17.5 17.3,16.3 19.2,16.3\" fill=\"#DE2910\"/><polygon points=\"15,18.5 15.8,20.3 17.7,20.3 16.2,21.5 16.8,23.5 15,22.3 13.2,23.5 13.8,21.5 12.3,20.3 14.2,20.3\" fill=\"#DE2910\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#zh-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>"};
  var RU_NAMES = { ky: 'Киргизский', az_N11: 'Азербайджанский (N11)', zh_Hans: 'Китайский (упрощённый)', zh_Hant: 'Китайский (традиционный)', en_US: 'Английский (США)', en_GB: 'Английский (Великобритания)' };
  var WL_NAMES = {};
  var displayNames = null;
  try { displayNames = new Intl.DisplayNames(['ru'], { type: 'language' }); } catch (e) {}
  function langName(code) {
    if (RU_NAMES[code]) return RU_NAMES[code];
    var wl = WL_NAMES[code] || code;
    if (/generated/i.test(wl)) return wl;
    try {
      var n = displayNames && displayNames.of(code.replace(/_/g, '-'));
      if (n && n.toLowerCase() !== code.toLowerCase().replace(/_/g, '-')) return n[0].toUpperCase() + n.slice(1);
    } catch (e) {}
    return wl;
  }
  var flagSeq = 0;
  function flag(code) {
    var svg = FLAGS[code] || FLAGS[code.toLowerCase().split(/[_\-@]/)[0]];
    var box = document.createElement('span');
    box.className = 'flag';
    if (svg) {
      try {
        /* у каждого флага свои id: иначе флаг на видимой вкладке ссылается на градиент во флаге на скрытой и не рисуется */
        var uid = '-f' + (++flagSeq);
        svg = svg.replace(/(\bid="|url\(#|href="#)([^")]+)/g, function (m0, a, b) { return a + b + uid; });
        var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        box.appendChild(document.importNode(doc.documentElement, true));
      } catch (e) {}
    }
    return box;
  }
  function langLabel(code) {
    var s = document.createElement('span');
    s.className = 'lang';
    s.appendChild(flag(code));
    s.appendChild(document.createTextNode(langName(code)));
    return s;
  }

  /* ---------- storage ---------- */
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- HTTP ---------- */
  function http(url, asText) {
    return fetch(url, { credentials: 'same-origin', headers: { 'Accept': asText ? '*/*' : 'application/json' } })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error('HTTP ' + r.status + ' ' + url + (t ? ': ' + t.slice(0, 200) : ''));
            err.status = r.status;
            throw err;
          });
        }
        return asText ? r.text() : r.json();
      });
  }
  function paginate(url) {
    var out = [];
    function step(u) {
      return http(u).then(function (d) {
        out = out.concat(d.results || []);
        if (d.next) {
          var n = new URL(d.next, location.origin);
          return step(n.pathname + n.search);
        }
        return out;
      });
    }
    return step(url);
  }
  /* ---------- компоненты, в т.ч. внутри категорий: c = «категория/компонент» ---------- */
  var COMP_API = {}, TR_API = {}, PROJECT_COMPS = {};
  function pathOf(u) {
    try { var x = new URL(u, location.origin).pathname; return x.slice(-1) === '/' ? x : x + '/'; } catch (e) { return null; }
  }
  function compApi(p, c) { return COMP_API[p + '/' + c] || '/api/components/' + p + '/' + c.split('/').join('%252F') + '/'; }
  function trApi(p, c, lang) { return TR_API[p + '/' + c + '/' + lang] || '/api/translations/' + p + '/' + c.split('/').join('%252F') + '/' + lang + '/'; }
  function fileKey(c) { return c.split('/').join('__'); }
  function projectComponents(p) {
    if (!PROJECT_COMPS[p]) {
      PROJECT_COMPS[p] = paginate('/api/projects/' + p + '/components/?page_size=1000').then(function (list) {
        return list.map(function (x) {
          var web = x.web_url ? pathOf(x.web_url) : null, pre = '/projects/' + p + '/';
          var c = web && web.indexOf(pre) === 0 ? decodeURIComponent(web.slice(pre.length, -1)) : x.slug;
          if (x.url) COMP_API[p + '/' + c] = pathOf(x.url);
          return { p: p, c: c, glossary: !!x.is_glossary };
        });
      });
      PROJECT_COMPS[p].catch(function () { delete PROJECT_COMPS[p]; });
    }
    return PROJECT_COMPS[p];
  }
  function translations(p, c) {
    return paginate(compApi(p, c) + 'translations/').then(function (trs) {
      trs.forEach(function (t) {
        WL_NAMES[t.language.code] = t.language.name;
        if (t.url) TR_API[p + '/' + c + '/' + t.language.code] = pathOf(t.url);
      });
      return trs;
    });
  }
  function downloadPo(p, c, lang, q) {
    var qs = '?format=po&q=' + encodeURIComponent(q);
    return http(trApi(p, c, lang) + 'file/' + qs, true)
      .catch(function (e) {
        return http('/download/' + p + '/' + c + '/' + lang + '/' + qs, true).catch(function () { throw e; });
      });
  }

  /* ---------- ссылки ---------- */
  function parseLinks(text) {
    var seen = {}, out = [];
    var re = /\/projects\/([^\s#?"'<>]+)/g, m;
    while ((m = re.exec(text))) {
      var segs = m[1].split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
      if (!segs.length || seen[segs.join('/')]) continue;
      seen[segs.join('/')] = 1;
      out.push({ p: segs[0], segs: segs.slice(1), text: segs.join('/') });
    }
    return out;
  }
  /* ссылка → компоненты: на компонент, на категорию (все компоненты в ней) или на проект (все) */
  function resolveLinks(text) {
    var list = parseLinks(text), out = [], seen = {}, missing = [];
    function add(p, c) { if (!seen[p + '/' + c]) { seen[p + '/' + c] = 1; out.push({ p: p, c: c }); } }
    return Promise.all(list.map(function (l) {
      return projectComponents(l.p).then(function (all) { return { l: l, all: all }; }, function () { return { l: l, all: null }; });
    })).then(function (rs) {
      rs.forEach(function (r) {
        var l = r.l, before = out.length;
        if (!r.all) { if (l.segs.length) add(l.p, l.segs[0]); else missing.push(l.text); return; }
        var known = {};
        r.all.forEach(function (x) { known[x.c] = 1; });
        for (var k = l.segs.length; k > 0; k--) {
          var path = l.segs.slice(0, k).join('/');
          if (known[path]) { add(l.p, path); return; }
        }
        var prefix = l.segs.length ? l.segs.join('/') + '/' : '';
        r.all.forEach(function (x) { if (!x.glossary && x.c.indexOf(prefix) === 0) add(l.p, x.c); });
        if (out.length === before) missing.push(l.text);
      });
      return { comps: out, missing: missing };
    });
  }
  function baseLang(code) { return code.toLowerCase().split(/[_\-@]/)[0]; }
  function matchLanguage(wanted, trs) {
    var codes = trs.map(function (t) { return t.language.code; });
    if (codes.indexOf(wanted) >= 0) return wanted;
    var same = codes.filter(function (c) { return baseLang(c) === baseLang(wanted); });
    return same.length === 1 ? same[0] : null;
  }

  /* ---------- Smartcat: запросы идут через фон расширения (там же хранится ключ) ---------- */
  var HAS_EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage);
  function scCall(type, data) {
    return new Promise(function (resolve, reject) {
      if (!HAS_EXT) return reject(new Error('Smartcat работает только в расширении'));
      chrome.runtime.sendMessage(Object.assign({ type: type }, data || {}), function (r) {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!r || !r.ok) return reject(new Error((r && r.error) || 'нет ответа от расширения'));
        resolve(r.data);
      });
    });
  }
  /* языки машперевода — как в проекте Smartcat «AI translation 4 MP» */
  var MT_LANGS = ['kk', 'ky', 'tg', 'ka', 'hy', 'uz', 'az', 'en'];
  /* если в Weblate у языка несколько вариантов (en / en_US, uz / uz_Latn) — берём один:
     для узбекского латиницу, для остальных основной код */
  /* выгружаем, но в Smartcat не отправляем (сейчас таких нет: AZ тоже идёт на машперевод) */
  var EXPORT_ONLY_LANGS = [];
  function mtPick(codes, bases) {
    var out = [];
    (bases || MT_LANGS).forEach(function (b) {
      var c = codes.filter(function (x) { return baseLang(x) === b && !/generated/i.test(WL_NAMES[x] || ''); });
      if (!c.length) return;
      var pick = b === 'uz' ? (c.filter(function (x) { return /latn/i.test(x); })[0] || c.filter(function (x) { return x === b; })[0])
        : c.filter(function (x) { return x === b; })[0];
      out.push(pick || c.sort(function (x, y) { return x.length - y.length; })[0]);
    });
    return out;
  }
  /* код Weblate → код Smartcat: из настроек (uz_Latn=uz-Latn) или просто «_» → «-» */
  /* коды Smartcat по умолчанию (как в проекте «AI translation 4 MP»); настройки в ⚙ их дополняют/перебивают */
  /* куда дополнительно класть английский (без папки, «ДДММГГ_имяфайла.po»), обратно оттуда не забираем */
  var SC_EN_DEFAULTS = {
    android: 'https://smartcat.com/projects/732af7d0-0e14-4705-99dd-97b31f8f4933',
    ios: 'https://smartcat.com/projects/85c99769-dcf4-429c-8432-7ed09a4d2f10',
    web: 'МП Web'   // для веба в Smartcat уходит только английский — сюда, в папку «ДДММГГ web»
  };
  var SC_PROJECT_DEFAULT = 'AI translation 4 MP';
  var SC_LANG_DEFAULTS = 'ru=ru-RU\nen=en\nen_US=en\nkk=kk\nky=ky\ntg=tg\nka=ka\nhy=hy\nuz=uz-Latn\nuz_Latn=uz-Latn\naz=az-Latn';
  function scPlatform(p, c) {
    var t = (p + '/' + c).toLowerCase();
    if (/android/.test(t)) return 'android';
    if (/(^|[^a-z])ios([^a-z]|$)/.test(t)) return 'ios';
    return 'web';
  }
  function ddmmyy() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + ('0' + (d.getMonth() + 1)).slice(-2) + String(d.getFullYear()).slice(-2); }
  function scLangMap(text) {
    var m = {};
    (SC_LANG_DEFAULTS + '\n' + String(text || '')).split(/[\n,;]+/).forEach(function (l) {
      var kv = l.split('=');
      if (kv.length === 2 && kv[0].trim() && kv[1].trim()) m[kv[0].trim()] = kv[1].trim();
    });
    return function (code) { return m[code] || code.replace(/_/g, '-'); };
  }
  /* ---------- PO filter: keep header + empty / fuzzy entries ---------- */
  function unquote(s) {
    s = s.trim();
    return s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s;
  }
  function wordCount(s) {
    s = s.replace(/\\n|\\t/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\{\{?[^}]*\}\}?|%\w/g, ' ');
    var m = s.match(/[\p{L}\p{N}_]+/gu);
    return m ? m.length : 0;
  }
  function poEntries(text) {
    var out = [];
    text.replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach(function (b) {
      var lines = b.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var fuzzy = lines.some(function (l) { return l.indexOf('#,') === 0 && l.indexOf('fuzzy') >= 0; });
      var obsolete = lines.every(function (l) { return l[0] === '#'; }) && lines.some(function (l) { return l.indexOf('#~') === 0; });
      var f = {}, key = null;
      lines.forEach(function (l) {
        if (l[0] === '#') return;
        var m = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(".*")\s*$/.exec(l);
        if (m) { key = m[1]; f[key] = unquote(m[2]); }
        else if (l.trim()[0] === '"' && key) { f[key] += unquote(l); }
      });
      if (f.msgid === undefined) return;
      var strs = Object.keys(f).filter(function (k) { return k.indexOf('msgstr') === 0; }).map(function (k) { return f[k]; });
      out.push({
        lines: lines, fuzzy: fuzzy, obsolete: obsolete, msgid: f.msgid, plural: f.msgid_plural || '', strs: strs, ctx: f.msgctxt || '',
        header: f.msgid === '' && !f.msgid_plural,
        done: !!strs.length && strs.every(function (x) { return x !== ''; }) && !fuzzy
      });
    });
    return out;
  }
  function filterPo(text, dropPlurals) {
    var keep = [], n = 0, words = 0, plurals = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) { keep.push(e.lines.join('\n')); return; }
      if (e.obsolete || e.done) return;
      if (e.plural) { plurals++; if (dropPlurals) return; }
      keep.push(e.lines.join('\n'));
      n++;
      words += wordCount(e.msgid) + wordCount(e.plural);
    });
    return { text: keep.join('\n\n') + '\n', strings: n, words: words, plurals: plurals };
  }

  /* ---------- плюралки → i18next JSON ---------- */
  var CAT_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];
  function pluralCats(code) {
    try {
      var c = new Intl.PluralRules(code.replace(/_/g, '-')).resolvedOptions().pluralCategories;
      return CAT_ORDER.filter(function (x) { return c.indexOf(x) >= 0; });
    } catch (e) { return ['one', 'other']; }
  }
  /* подогнать категории CLDR под число форм в Weblate (у русского в Weblate 3 формы без other) */
  function fitCats(cats, n) {
    cats = cats.slice();
    if (cats.length > n && cats.indexOf('other') >= 0) cats.splice(cats.indexOf('other'), 1);
    return cats.length === n ? cats : null;
  }
  var FORMATS = {};
  function componentFormat(p, c) {
    var k = p + '/' + c;
    if (!FORMATS[k]) FORMATS[k] = http(compApi(p, c)).then(function (d) { return d.file_format || ''; }, function () { return ''; });
    return FORMATS[k];
  }
  function units(p, c, lang, q) {
    return paginate(trApi(p, c, lang) + 'units/?q=' + encodeURIComponent(q));
  }
  function pluralSuffixes(fmt, code, n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push('_' + i);
    if (fmt === 'i18next') return n === 2 ? ['', '_plural'] : idx;
    var cats = fitCats(pluralCats(code), n);
    return cats ? cats.map(function (c) { return '_' + c; }) : idx;
  }
  /* непереведённые плюралки → { "ключ_one": "…", "ключ_other": "…" }; где перевода нет — русский исходник нужной формы */
  function pluralJson(list, fmt, srcCode, tgtCode) {
    var out = {}, strings = 0, words = 0;
    list.forEach(function (u) {
      if (!u.source || u.source.length < 2 || u.state >= 20 || !u.context) return;
      var n = u.target && u.target.length > 1 ? u.target.length : pluralCats(tgtCode).length;
      var sufs = pluralSuffixes(fmt, tgtCode, n);
      var tgtCats = fitCats(pluralCats(tgtCode), n);
      var srcCats = fitCats(pluralCats(srcCode), u.source.length);
      sufs.forEach(function (suf, i) {
        var val = u.target && u.target[i];
        if (!val) {
          var j = Math.min(i, u.source.length - 1);
          if (tgtCats && srcCats) {
            var cat = tgtCats[i];
            j = srcCats.indexOf(cat);
            if (j < 0) j = srcCats.indexOf('many') >= 0 ? srcCats.indexOf('many') : u.source.length - 1;
          }
          val = u.source[j];
        }
        out[u.context + suf] = val;
      });
      strings++;
      words += u.num_words || wordCount(u.source[0]);
    });
    return { text: JSON.stringify(out, null, 2) + '\n', strings: strings, words: words };
  }
  function poInfo(text) {
    var headers = {}, filled = 0, total = 0, withText = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) {
        e.strs.join('').split('\\n').forEach(function (l) {
          var i = l.indexOf(':');
          if (i > 0) headers[l.slice(0, i).trim()] = l.slice(i + 1).trim();
        });
        return;
      }
      if (e.obsolete) return;
      total++;
      if (e.done) filled++;
      /* с текстом перевода, даже если помечено «требует правки» — так Smartcat отдаёт неподтверждённый машинный перевод */
      if (e.strs.length && e.strs.every(function (x) { return x !== ''; })) withText++;
    });
    return { headers: headers, filled: filled, total: total, withText: withText };
  }
  /* Smartcat иногда портит длинные строки (эмодзи, неразрывный пробел): кавычка не закрыта, конец исходника уезжает в msgstr.
     Weblate тогда отклоняет файл целиком («end-of-line within string»). Такие записи выкидываем, остальное оставляем.
     → null, если файл в порядке; иначе { text, dropped: [ключи] } */
  var PO_STR = /^\s*(?:#~\s*)?(?:(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+)?"((?:[^"\\]|\\.)*)"\s*$/;
  function quoteCount(l) {
    var n = 0;
    for (var i = 0; i < l.length; i++) { if (l[i] === '\\') { i++; continue; } if (l[i] === '"') n++; }
    return n;
  }
  /* Smartcat иногда пишет настоящий перенос строки внутри "…" вместо \n — склеиваем обратно через \n */
  function joinBrokenStrings(lines) {
    var out = [], joined = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], t = l.trim();
      if (t && t[0] !== '#' && t.indexOf('"') >= 0 && quoteCount(l) % 2) {
        var buf = l, j = i;
        while (quoteCount(buf) % 2 && j + 1 < lines.length && !/^\s*(msgctxt|msgid|msgstr|#)/.test(lines[j + 1])) { j++; buf += '\\n' + lines[j]; }
        if (!(quoteCount(buf) % 2) && PO_STR.test(buf)) { out.push(buf); joined++; i = j; continue; }
      }
      out.push(l);
    }
    return { lines: out, joined: joined };
  }
  function fixPo(text) {
    var jb = joinBrokenStrings(String(text).replace(/\r\n?/g, '\n').split('\n'));
    var lines = jb.lines;
    var bad = lines.some(function (l) { return l.trim() && l.trim()[0] !== '#' && !PO_STR.test(l); });
    if (!bad) return jb.joined ? { text: lines.join('\n'), dropped: [], joined: jb.joined } : null;
    var groups = [], g = null;
    lines.forEach(function (l) {
      var t = l.trim(), m = PO_STR.exec(l), key = m && m[1];
      if (!t) { g = null; return; }
      var startsNew = !g || (g.hasStr && (t[0] === '#' || key === 'msgctxt' || key === 'msgid'));
      if (startsNew) { g = { lines: [], ok: true, hasStr: false, ctx: '', id: null }; groups.push(g); }
      g.lines.push(l);
      if (t[0] === '#') { if (g.hasStr || g.id !== null) g.ok = false; return; }
      if (!m) { g.ok = false; return; }
      if (key === 'msgctxt') g.ctx = m[2];
      if (key === 'msgid') g.id = m[2];
      if (key && key.indexOf('msgstr') === 0) g.hasStr = true;
    });
    var dropped = [], out = [], lastKey = '';
    groups.forEach(function (x) {
      var hasId = x.id !== null;
      var key = x.ctx || (x.id ? poStr(x.id).slice(0, 40) : '');
      if (x.ok && hasId && x.hasStr) { out.push(x.lines.join('\n')); lastKey = key; return; }
      if (!hasId && !x.hasStr && x.lines.every(function (l) { return l.trim()[0] === '#'; })) return;   // осиротевшие комментарии
      /* кусок без ключа — обрывок предыдущей испорченной строки: не считаем отдельной строкой */
      if (!key) { if (!dropped.length || dropped[dropped.length - 1] !== lastKey) dropped.push(lastKey ? lastKey + ' (обрывок)' : 'без ключа'); return; }
      if (dropped.indexOf(key) < 0) dropped.push(key);
      lastKey = key;
    });
    return { text: out.join('\n\n') + '\n', dropped: dropped, joined: jb.joined };
  }
  /* ---------- переменные: {{count}}, %s, %1$d, {name}, $t(key), теги ----------
     Ошибка (строку не грузим): переменная, которой нет в исходнике (опечатка), или сломанная скобка.
     Предупреждение: переменная пропала, слиплась со словом, теги не совпадают.
     Учитываем язык: в az / tr / uz к переменной приклеиваются окончания ({{count}}-dən, {{name}}'in) — это не ошибка;
     в плюралках форма «один» может быть без числа. */
  var VAR_GLUE_OK = ['az', 'tr', 'uz', 'tk', 'ka', 'am'];   // окончания и приставки пишутся слитно: {{count}}-dən, ለ{{count}}
  var VAR_COUNT = /^(\{\{(count|displaycount|n|num|number|value|amount)\b[^}]*\}\}|%(\d+\$)?d|\{(count|n)\})$/i;
  /* kinds — какие виды переменных искать (по исходнику): в переводе ищем только те, что есть в исходнике,
     иначе «22%-dək» в азербайджанском похоже на %-d */
  function varParse(s, kinds) {
    kinds = kinds || { i18n: 1, nest: 1, printf: 1, single: 1 };
    var toks = [], tags = [], rest = String(s || ''), found = {};
    function take(re, kind, norm) {
      rest = rest.replace(re, function (m, x) { found[kind] = 1; if (kinds[kind]) toks.push(norm ? norm(m, x) : m); return ' '; });
    }
    take(/\{\{\s*([^{}]+?)\s*\}\}/g, 'i18n', function (m, x) { return '{{' + x.replace(/\s+/g, '') + '}}'; });
    take(/\$t\([^)]*\)/g, 'nest', function (m) { return m.replace(/\s+/g, ''); });
    if (kinds.printf) take(/%(\d+\$)?[-+0#]?\d*(?:\.\d+)?[sdif@]/g, 'printf');
    if (kinds.single) take(/\{[A-Za-z_][\w.]*\}/g, 'single');
    String(s || '').replace(/<\/?([a-zA-Z][\w-]*)[^>]*>/g, function (m, n) { tags.push(n.toLowerCase()); return m; });
    return { toks: toks, tags: tags.sort().join(','), stray: /[{}]/.test(rest), kinds: found };
  }
  function checkVars(srcs, forms, lang, isPlural) {
    var S = varParse(srcs.join('\n')), srcSet = {}, probs = [], seen = {};
    var kinds = { i18n: 1, nest: 1, printf: S.kinds.printf, single: S.kinds.single };
    var braces = S.kinds.i18n || S.kinds.single;
    S.toks.forEach(function (t) { srcSet[t] = 1; });
    var glueOk = VAR_GLUE_OK.indexOf(baseLang(lang || '')) >= 0;
    var srcGlue = /\}\}[\p{L}]|[\p{L}]\{\{/u.test(srcs.join(' '));
    function add(hard, text) { if (!seen[text]) { seen[text] = 1; probs.push({ hard: hard, text: text }); } }
    forms.forEach(function (f) {
      if (!f) return;
      var T = varParse(f, kinds);
      T.toks.forEach(function (t) { if (!srcSet[t]) add(true, 'лишняя переменная ' + t + ' — в исходнике её нет'); });
      if (braces && T.stray && !S.stray) add(true, 'сломана скобка у переменной');
      Object.keys(srcSet).forEach(function (t) {
        if (T.toks.indexOf(t) < 0 && !(isPlural && VAR_COUNT.test(t))) add(false, 'нет переменной ' + t);
      });
      if (!glueOk && !srcGlue) {
        var g = /\{\{[^{}]+\}\}[\p{L}]+|[\p{L}]+\{\{[^{}]+\}\}/u.exec(f);
        if (g) add(false, 'переменная слиплась со словом: «' + g[0] + '»');
      }
      if (S.tags !== T.tags) add(false, 'теги не совпадают с исходником');
    });
    return probs;
  }
  function varScan(u) {
    if (u.vars !== undefined) return u.vars;
    if (u.error || !u.text) return null;
    var list = [];
    if (/\.json$/i.test(u.name)) {
      var obj = {}; try { obj = JSON.parse(u.text); } catch (e) { return null; }
      Object.keys(obj).forEach(function (k) {
        var probs = mtLeak('', String(obj[k] || ''), u.lang, true);
        if (probs.length) list.push({ idx: k, ctx: k, src: '', tr: String(obj[k]), probs: probs, hard: true });
      });
      u.vars = list.length ? list : null;
      return u.vars;
    }
    poEntries(u.text).forEach(function (e, idx) {
      if (e.header || e.obsolete || !e.strs.some(Boolean)) return;
      var srcs = [poStr(e.msgid), poStr(e.plural)].filter(Boolean);
      var probs = checkVars(srcs, e.strs.map(poStr), u.lang, !!e.plural)
        .concat(mtLeak(srcs.join('\n'), e.strs.map(poStr).join('\n'), u.lang));
      if (probs.length) list.push({ idx: idx, ctx: poStr(e.ctx), src: poStr(e.msgid), tr: e.strs.map(poStr).join(' | '), probs: probs,
        hard: probs.some(function (x) { return x.hard; }) });
    });
    u.vars = list.length ? list : null;
    return u.vars;
  }
  function dropEntries(text, idxs) {
    return poEntries(text).filter(function (e, i) { return idxs.indexOf(i) < 0; }).map(function (e) { return e.lines.join('\n'); }).join('\n\n') + '\n';
  }
  function applyPoFix(u) {
    if (/\.json$/i.test(u.name) || !u.text) return;
    var fx = fixPo(u.text), notes = [];
    if (fx) {
      u.text = fx.text;
      if (fx.joined) notes.push('склеила разорванные строки: ' + fx.joined);
      if (fx.dropped.length) { u.fixedKeys = fx.dropped; notes.push('смарткат испортил ' + fx.dropped.length + ' стр. — убрала, остальное загружу (' + fx.dropped.join(', ') + ')'); }
    }
    var nl = fixNewlines(u.text);
    if (nl.n) { u.text = nl.text; notes.push('убрала лишние переносы строк: ' + nl.n); }
    if (notes.length) u.note = (u.note ? u.note + ' · ' : '') + notes.join(' · ');
  }
  /* заменить msgstr у записи (строки в экранированном виде, как в файле) */
  function setPoStrs(e, strs) {
    var out = [], cur = null;
    e.lines.forEach(function (l) {
      var m = PO_STR.exec(l);
      if (m && m[1]) cur = m[1]; else if (!m) cur = null;
      if (cur && cur.indexOf('msgstr') === 0) return;
      out.push(l);
    });
    if (!e.plural && strs.length === 1) out.push('msgstr "' + strs[0] + '"');
    else strs.forEach(function (x, i) { out.push('msgstr[' + i + '] "' + x + '"'); });
    return out.join('\n');
  }
  /* в исходнике нет переносов, а машперевод разбил строку на несколько — склеиваем пробелом */
  function fixNewlines(text) {
    var n = 0;
    var parts = poEntries(text).map(function (e) {
      if (e.header || e.obsolete || !e.strs.some(Boolean)) return e.lines.join('\n');
      var src = e.msgid + (e.plural || '');
      if (/\\n/.test(src) || !e.strs.some(function (x) { return /\\n/.test(x); })) return e.lines.join('\n');
      n++;
      return setPoStrs(e, e.strs.map(function (x) { return x.replace(/(?:[ \t]|\\n)*\\n(?:[ \t]|\\n)*/g, ' ').replace(/^ | $/g, ''); }));
    });
    return n ? { text: parts.join('\n\n') + '\n', n: n } : { text: text, n: 0 };
  }
  /* «мусор» от машперевода: пояснения, контекст, варианты, разметка — такие строки не грузим */
  var LEAK_WORDS = /(?:^|[\s(*\[«"—-])(context|note|notes|translation|translated|alternative(?:ly)?|usually|most natural|literally|explanation|meaning|here is|here's|option\s*\d|variant\s*\d)\b/i;
  var LEAK_LABEL = /[(*\[]\s*\**\s*[\p{Lu}][\p{Lu} -]{3,}\s*:/u;
  function mtLeak(src, tr, lang, noSrc) {
    var probs = [];
    if (!tr) return probs;
    var en = baseLang(lang || '') === 'en';
    function frag(m) { var i = Math.max(0, m.index - 10); return '«' + tr.slice(i, i + 50).replace(/\s+/g, ' ') + (tr.length > i + 50 ? '…' : '') + '»'; }
    var w = !en && LEAK_WORDS.exec(tr);
    if (w && (noSrc || src.toLowerCase().indexOf(w[1].toLowerCase()) < 0)) probs.push({ hard: true, text: 'похоже, смарткат дописал пояснение: ' + frag(w) });
    var lb = LEAK_LABEL.exec(tr);
    if (lb && (noSrc || !LEAK_LABEL.test(src))) probs.push({ hard: true, text: 'похоже, смарткат вставил примечание: ' + frag(lb) });
    var md = /\*\*|\*\(|\)\*/.exec(tr);
    if (md && (noSrc || !/\*/.test(src))) probs.push({ hard: true, text: 'в переводе разметка * — в исходнике её нет: ' + frag(md) });
    if (!noSrc && src && tr.length > src.length * 3 + 60) probs.push({ hard: true, text: 'перевод в ' + Math.round(tr.length / src.length) + ' раз длиннее исходника — похоже, смарткат дописал лишнее' });
    return probs;
  }

  /* ---------- ZIP (store, UTF-8 names) ---------- */
  var CRC = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, name, data);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  /* ---------- папка для архивов: выбирается один раз (File System Access API), хранится в IndexedDB ---------- */
  var dirHandle = null, dirLoaded = null;
  function dirDb(op, val) {
    return new Promise(function (res, rej) {
      var rq = indexedDB.open('wlx-dir', 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore('h'); };
      rq.onerror = function () { rej(rq.error); };
      rq.onsuccess = function () {
        var db = rq.result, st = db.transaction('h', op === 'get' ? 'readonly' : 'readwrite').objectStore('h');
        var r = op === 'get' ? st.get('dir') : op === 'del' ? st.delete('dir') : st.put(val, 'dir');
        r.onsuccess = function () { res(r.result); db.close(); };
        r.onerror = function () { rej(r.error); };
      };
    });
  }
  function loadDir() {
    if (!dirLoaded) dirLoaded = dirDb('get').then(function (h) { dirHandle = h || null; return dirHandle; }, function () { return null; });
    return dirLoaded;
  }
  function pickDir() {
    if (!window.showDirectoryPicker) return Promise.reject(new Error('этот браузер не умеет выбирать папку — нужен Chrome'));
    return window.showDirectoryPicker({ id: 'wlx-archives', mode: 'readwrite', startIn: 'desktop' }).then(function (h) {
      dirHandle = h; dirLoaded = Promise.resolve(h);
      return dirDb('put', h).then(function () { return h; });
    });
  }
  function forgetDir() { dirHandle = null; dirLoaded = Promise.resolve(null); return dirDb('del'); }
  function freeName(dir, name) {
    var m = /^(.*?)(\.[^.]+)?$/.exec(name), n = 1;
    function tryName(nm) {
      return dir.getFileHandle(nm).then(function () { n++; return n > 99 ? nm : tryName(m[1] + ' (' + n + ')' + (m[2] || '')); }, function () { return nm; });
    }
    return tryName(name);
  }
  function saveToDir(blob, name) {
    var h = dirHandle;
    return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? p : h.requestPermission({ mode: 'readwrite' }); }).then(function (p) {
      if (p !== 'granted') throw new Error('нет разрешения на папку');
      var sub = sget('wlx_dir_dated') === '0' ? '' : ddmmyy();
      return (sub ? h.getDirectoryHandle(sub, { create: true }) : Promise.resolve(h)).then(function (d) {
        return freeName(d, name).then(function (nm) {
          return d.getFileHandle(nm, { create: true }).then(function (fh) { return fh.createWritable(); })
            .then(function (w) { return w.write(blob).then(function () { return w.close(); }); })
            .then(function () { return h.name + '/' + (sub ? sub + '/' : '') + nm; });
        });
      });
    });
  }
  /* папки по платформам на компьютере: ДДММГГ_web / ДДММГГ_iOS / ДДММГГ_android */
  function platDir(p, c) { var pl = scPlatform(p, c); return ddmmyy() + '_' + (pl === 'ios' ? 'iOS' : pl); }
  /* выгрузка «папками»: если выбрана папка для архивов и включено «без zip» — пишем файлы прямо туда (по умолчанию выключено) */
  function unzipToDir() { return !!dirHandle && sget('wlx_dir_unzip') === '1'; }
  function saveFilesToDir(files) {
    var h = dirHandle, cache = {};
    function dirFor(path) {
      var parts = path.split('/').slice(0, -1), key = '';
      return parts.reduce(function (pr, part) {
        return pr.then(function (d) { key += '/' + part; if (!cache[key]) cache[key] = d.getDirectoryHandle(part, { create: true }); return cache[key]; });
      }, Promise.resolve(h));
    }
    return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? p : h.requestPermission({ mode: 'readwrite' }); }).then(function (p) {
      if (p !== 'granted') throw new Error('нет разрешения на папку');
      return files.reduce(function (pr, f) {
        return pr.then(function () {
          return dirFor(f.name).then(function (d) {
            return d.getFileHandle(f.name.split('/').pop(), { create: true }).then(function (fh) { return fh.createWritable(); })
              .then(function (w) { return w.write(new Blob([f.text])).then(function () { return w.close(); }); });
          });
        });
      }, Promise.resolve()).then(function () {
        var tops = {}; files.forEach(function (f) { var t = f.name.split('/')[0]; if (f.name.indexOf('/') > 0) tops[t] = (tops[t] || 0) + 1; });
        return Object.keys(tops).sort().map(function (t) { return h.name + '/' + t + ' (' + tops[t] + ')'; }).join(', ');
      });
    });
  }
  /* сохранить набор файлов: папками (если можно) или zip; файлы в ДДММГГ_web/_iOS/_android — отдельный zip на платформу */
  function saveFiles(files, zipName) {
    if (!unzipToDir()) {
      var groups = {}, rest = [];
      files.forEach(function (f) {
        var m = /^(\d{6}_(?:web|iOS|android))\/(.+)$/.exec(f.name);
        if (m) (groups[m[1]] = groups[m[1]] || []).push({ name: m[2], text: f.text }); else rest.push(f);
      });
      var names = Object.keys(groups).sort();
      if (!names.length) { saveBlob(makeZip(files), zipName); return; }
      names.forEach(function (g, i) { setTimeout(function () { saveBlob(makeZip(groups[g].concat(rest)), g + '.zip'); }, i * 600); });
      return;
    }
    saveFilesToDir(files).then(function (where) { toast('✓ Сохранено папками: ' + where); }, function (e) {
      saveBlob(makeZip(files), zipName);
      toast('Не получилось сохранить папками (' + (e.message || e) + ') — сохранила zip', true);
    });
  }
  /* архивы (.zip) — в выбранную папку, если она есть; остальное и запасной вариант — обычное скачивание */
  function saveBlob(blob, name) {
    if (!/\.zip$/i.test(name) || !dirHandle) { downloadBlob(blob, name); return; }
    saveToDir(blob, name).then(function (path) { toast('✓ Сохранено: ' + path); }, function (e) {
      downloadBlob(blob, name);
      toast('Папка для архивов недоступна (' + (e.message || e) + ') — скачала в «Загрузки». Проверь папку в ⚙', true);
    });
  }
  var toastEl = null, toastTimer = null;
  function toast(text, bad) {
    if (!toastEl) return;
    toastEl.textContent = text; toastEl.className = 'toast' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.className = 'toast hide'; }, bad ? 12000 : 6000);
  }
  loadDir();

  /* ---------- ZIP read (stored / deflate) ---------- */
  function readZip(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder('utf-8'), eocd = -1;
    for (var i = buf.byteLength - 22; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return Promise.reject(new Error('не похоже на zip-архив'));
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), jobs = [];
    for (var k = 0; k < count; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var loc = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      var start = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
      var data = u8.slice(start, start + csize);
      p += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || /__MACOSX/.test(name) || !/\.(po|json)$/i.test(name)) continue;
      jobs.push((function (name, method, data) {
        var bytes = method === 0 ? Promise.resolve(data.buffer)
          : new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        return bytes.then(function (b) { return { name: name, text: dec.decode(b) }; });
      })(name, method, data));
    }
    return Promise.all(jobs);
  }

  /* ---------- upload ---------- */
  function csrfToken() {
    var i = document.querySelector('input[name=csrfmiddlewaretoken]');
    if (i && i.value) return Promise.resolve(i.value);
    var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    if (m) return Promise.resolve(decodeURIComponent(m[1]));
    return fetch('/', { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (t) {
      var m2 = /name="csrfmiddlewaretoken"\s+value="([^"]+)"/.exec(t);
      if (!m2) throw new Error('Не нашла CSRF-токен — открой любую страницу Weblate и попробуй ещё раз');
      return m2[1];
    });
  }
  function uploadPo(u, opts, token) {
    function form(api) {
      var fd = new FormData();
      var isJson = /\.json$/i.test(u.name);
      fd.append('file', new Blob([u.text], { type: isJson ? 'application/json' : 'text/x-gettext-translation' }), u.name.split('/').pop());
      fd.append('method', opts.method); fd.append('fuzzy', opts.fuzzy); fd.append('conflicts', opts.conflicts);
      if (!api) fd.append('csrfmiddlewaretoken', token);
      return fd;
    }
    var path = u.p + '/' + u.c + '/' + u.lang + '/';
    return fetch(trApi(u.p, u.c, u.lang) + 'file/', {
      method: 'POST', credentials: 'same-origin', body: form(true),
      headers: { 'X-CSRFToken': token, 'Accept': 'application/json' }
    }).then(function (r) {
      return r.text().then(function (t) {
        if (r.ok) { try { return JSON.parse(t); } catch (e) { return { result: true }; } }
        if (r.status === 403 || r.status === 405) {
          return fetch('/upload/' + path, { method: 'POST', credentials: 'same-origin', body: form(false) }).then(function (r2) {
            if (!r2.ok) throw new Error('HTTP ' + r2.status + ': ' + t.slice(0, 200));
            return { viaForm: true };
          });
        }
        throw new Error('HTTP ' + r.status + ': ' + t.slice(0, 300));
      });
    });
  }

  /* ---------- UI ---------- */
  var CSS = [
    ':host{all:initial}',
    '.back{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:2147483646;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}',
    '.box{background:#fff;color:#1d2330;width:100%;max-width:760px;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:22px 22px 26px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}',
    'h1{font-size:19px;margin:0}',
    '.x{background:none;border:0;font-size:24px;line-height:1;cursor:pointer;color:#6b7385;padding:4px 8px}',
    '.sub{color:#6b7385;margin:0 0 14px;font-size:13px}',
    'h2{font-size:14px;margin:18px 0 8px}',
    'textarea{width:100%;box-sizing:border-box;min-height:140px;padding:9px 11px;border:1px solid #d9dde5;border-radius:8px;font:12.5px/1.5 Consolas,ui-monospace,monospace;resize:vertical;color:#1d2330;background:#fff}',
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}',
    'button.b{font:inherit;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;background:#1b8a6b;color:#fff;font-weight:600}',
    'button.g{background:#e8f5f0;color:#1b8a6b}',
    'button.s{padding:5px 11px;font-size:13px}',
    'button.big{font-size:16px;padding:12px 26px}',
    'button:disabled{opacity:.5;cursor:default}',
    '.langs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:2px;margin-top:8px}',
    '.langs label{display:flex;gap:7px;align-items:center;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.langs label:hover{background:#f3f5f8}',
    '.muted{color:#6b7385;font-size:12.5px}',
    '.err{color:#c0392b;white-space:pre-wrap;margin-top:8px;font-size:13px}',
    '.bar{height:9px;background:#e3e6ec;border-radius:6px;overflow:hidden;margin:8px 0 12px}',
    '.bar>div{height:100%;width:0;background:#1b8a6b;transition:width .25s}',
    'table{width:100%;border-collapse:collapse;font-size:13.5px}',
    'th,td{text-align:left;padding:7px 5px;border-bottom:1px solid #eceef2}',
    'th{color:#6b7385;font-weight:500;font-size:12.5px}',
    '.n{text-align:right;font-variant-numeric:tabular-nums}',
    'details{margin-top:12px}summary{cursor:pointer;color:#6b7385;font-size:13px}',
    '.blk{display:block;margin-top:10px}',
    '.red{color:#c0392b}',
    '.tabs{display:flex;gap:6px;margin:6px 0 4px;border-bottom:1px solid #eceef2;padding-bottom:10px}',
    '.tab{font:inherit;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:#f3f5f8;color:#1d2330;font-weight:600}',
    '.tab.on{background:#1b8a6b;color:#fff}',
    '.drop{display:block;border:2px dashed #cfd5de;border-radius:10px;padding:22px;text-align:center;cursor:pointer;color:#6b7385}',
    '.drop.over{border-color:#1b8a6b;background:#e8f5f0;color:#1b8a6b}',
    '.drop input{display:none}',
    '.opts{display:grid;grid-template-columns:1fr;gap:10px}',
    '.opts label{display:block;font-size:13px;color:#6b7385}',
    'select{display:block;width:100%;margin-top:4px;padding:8px 10px;border:1px solid #d9dde5;border-radius:8px;font:inherit;color:#1d2330;background:#fff}',
    '.ok{color:#1b8a6b}',
    '.flag{display:inline-block;width:24px;height:18px;flex:none;vertical-align:middle}',
    '.flag svg{width:24px;height:18px;display:block}',
    '.lang{display:inline-flex;align-items:center;gap:8px}',
    '.layouts{display:grid;gap:4px}',
    '.layouts label{display:flex;gap:8px;align-items:baseline;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.layouts label:hover{background:#f3f5f8}',
    '.complist{max-height:220px;overflow:auto;font:12.5px/1.6 Consolas,ui-monospace,monospace;color:#1d2330;padding:6px 0}',
    '.settings{margin:6px 0 10px;padding:12px 14px;border-radius:10px;background:#f3f5f8}',
    '.settings label{display:block;font-size:13px;color:#6b7385;margin-top:8px}',
    '.settings input,.settings select,.track input{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:7px 9px;border:1px solid #d9dde5;border-radius:7px;font:inherit;color:#1d2330;background:#fff}',
    'textarea.small{min-height:56px;margin-top:3px}',
    '.track{margin-top:18px;border-top:1px solid #eceef2;padding-top:4px}',
    '.scimp{margin-bottom:12px;padding:10px 12px;border-radius:10px;background:#f3f5f8}',
    '.scimp h2{margin-top:0}',
    '.scimp label.chk{display:flex;gap:5px;align-items:center;font-size:13px;color:#6b7385;cursor:pointer}',
    '.scimp input[type=checkbox]{width:16px;height:16px;margin:0;cursor:pointer}',
    '.scimp details label.chk{color:#1d2330;padding:3px 0 3px 22px;gap:10px}',
    '.scimp details summary{margin:8px 0 4px;font-size:13.5px}',
    '.scimp input[type=text]{display:block;width:100%;box-sizing:border-box;margin:4px 0;padding:7px 9px;border:1px solid #d9dde5;border-radius:7px;font:inherit;background:#fff;color:#1d2330}',
    '.scgroup{margin-top:10px;padding:8px 10px;border:1px solid #eceef2;border-radius:8px}',
    'select.presel{display:inline-block;width:auto;min-width:220px;margin:0;padding:6px 8px;border:1px solid #d9dde5;border-radius:7px;font:inherit;background:#fff;color:#1d2330}',
    'pre.report{white-space:pre-wrap;font:12.5px/1.55 Consolas,ui-monospace,monospace;background:#f3f5f8;border-radius:8px;padding:10px 12px;margin:6px 0;color:#1d2330}',
    '.card{border:1px solid #e3e6ec;border-radius:12px;padding:14px 16px;margin-top:14px;background:#fff}',
    '.card.scimp{background:#fff}',
    '.card .head{display:flex;justify-content:space-between;align-items:center;gap:10px}',
    'h3{font-size:15px;margin:0;color:#1d2330}',
    '.card .hint{color:#6b7385;font-size:12.5px;margin:4px 0 0}',
    '.scrow{display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #f0f1f4}',
    '.scrow .grow{flex:1;min-width:0}',
    '.scrow .grow div{margin-top:2px}',
    '.ftable{max-height:380px;overflow:auto;margin-top:8px;border:1px solid #eceef2;border-radius:8px}',
    '.ftable table{font-size:13px}',
    '.ftable th{position:sticky;top:0;background:#f7f8fa;z-index:1}',
    '.ftable td,.ftable th{padding:6px 8px}',
    '.ftable tr{cursor:pointer}',
    'input.pick{display:block;width:100%;min-width:170px;box-sizing:border-box;padding:5px 7px;border:1px solid #d9dde5;border-radius:6px;font:inherit;font-size:12.5px}',
    '.ftable tr.folder td{background:#fafbfc}',
    '.ftable tr:hover td{background:#f3f7f5}',
    '.crumbs{margin-top:8px;font-size:13px;color:#1d2330}',
    '.crumbs a{color:#1b8a6b;text-decoration:none;font-weight:600}',
    '.ftable input[type=checkbox]{width:16px;height:16px;margin:0;cursor:pointer}',
    '.setrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0 4px;color:#6b7385;font-size:13px}',
    '.settings h3{margin-top:16px}',
    '.settings .back2{margin-bottom:6px}',
    'td.brtr{max-width:320px;word-break:break-word}',
    '.ftable tr.done td{background:#f4faf7}',
    '.badge{display:inline-block;font-size:11.5px;font-weight:600;padding:1px 7px;border-radius:10px;margin-left:6px;vertical-align:1px;white-space:nowrap}',
    '.b-ok{background:#e3f4ec;color:#147a5c}.b-part{background:#fff4e0;color:#9a6200}.b-new{background:#eef1f5;color:#6b7385}',
    '.res{margin-top:12px;border-top:1px solid #eceef2;padding-top:10px}',
    '.res .line{font-size:13.5px;margin:4px 0}',
    '.res .bar{margin:6px 0 10px}',
    '.scimp label.chk input{margin-right:2px}',
    '.toast{position:sticky;top:0;z-index:5;margin:4px 0 8px;padding:9px 12px;border-radius:8px;background:#e3f4ec;color:#147a5c;font-size:13.5px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.08)}',
    '.toast.bad{background:#fdecea;color:#b03a2e}',
    '.hide{display:none}'
  ].join('\n');

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }

  var host = el('div', { id: 'wl-export-host' });
  var root = host.attachShadow({ mode: 'open' });
  try {
    var sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet];
  } catch (e) {
    root.appendChild(el('style', { text: CSS }));
  }

  var links = el('textarea', { placeholder: 'Вставь ссылки на компоненты — можно прямо сообщение из чата целиком' });
  var info = el('span', { class: 'muted' });
  var compList = el('div');
  var err1 = el('div', { class: 'err' });
  var langsBox = el('div', { class: 'langs' });
  var fuzzy = el('input', { type: 'checkbox' }); fuzzy.checked = true;
  var pluralsJson = el('input', { type: 'checkbox' });
  pluralsJson.checked = sget('wlx_pj') !== '0';
  pluralsJson.addEventListener('change', function () { sset('wlx_pj', pluralsJson.checked ? '1' : '0'); });
  var err2 = el('div', { class: 'err' });
  var progText = el('div', { class: 'muted' });
  var barFill = el('div');
  var results = el('div');
  var loadBtn = el('button', { class: 'b g', text: 'Загрузить языки', onclick: loadLangs });
  var goBtn = el('button', { class: 'b big', text: 'Выгрузить', onclick: runExport });
  var clearBtn = el('button', { class: 'b g s', text: 'Очистить', onclick: function () {
    links.value = ''; links.focus(); info.textContent = ''; err1.textContent = ''; compList.textContent = '';
    langSec.classList.add('hide'); resSec.classList.add('hide');
  } });
  var restoreBtn = el('button', { class: 'b g s', text: 'Вернуть прошлые ссылки', onclick: function () {
    links.value = sget('wlx_links') || '';
  } });
  var LAYOUTS = [
    ['component', 'По компонентам', 'папка на каждый компонент: wb-web-resale/, wb-web-rqx/…'],
    ['language', 'По языкам', 'папка на каждый язык: Грузинский/, Казахский/…'],
    ['flat', 'Всё в одну папку', 'все файлы вместе, без подпапок']
  ];
  var layoutBox = el('div', { class: 'layouts' });
  var savedLayout = sget('wlx_layout') || 'component';
  LAYOUTS.forEach(function (l) {
    var r = el('input', { type: 'radio', name: 'wlx-layout', value: l[0] });
    r.checked = l[0] === savedLayout;
    r.addEventListener('change', function () { sset('wlx_layout', l[0]); });
    layoutBox.appendChild(el('label', {}, [r, el('span', {}, [el('b', { text: l[1] }), el('span', { class: 'muted', text: ' — ' + l[2] })])]));
  });
  function currentLayout() {
    var r = layoutBox.querySelector('input:checked');
    return r ? r.value : 'component';
  }
  var englishApart = el('input', { type: 'checkbox' });
  englishApart.checked = sget('wlx_en') !== '0';
  englishApart.addEventListener('change', function () { sset('wlx_en', englishApart.checked ? '1' : '0'); });
  var skipEnglish = el('input', { type: 'checkbox' });
  skipEnglish.checked = sget('wlx_noen') !== '0';
  skipEnglish.addEventListener('change', function () { sset('wlx_noen', skipEnglish.checked ? '1' : '0'); });
  var byPlatform = el('input', { type: 'checkbox' });
  byPlatform.checked = sget('wlx_byplat') !== '0';
  byPlatform.addEventListener('change', function () { sset('wlx_byplat', byPlatform.checked ? '1' : '0'); });
  var langSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Языки' }),
    el('div', { class: 'row' }, [
      el('button', { class: 'b g s', text: 'Все', onclick: function () { setAll(true); } }),
      el('button', { class: 'b g s', text: 'Снять все', onclick: function () { setAll(false); } }),
      el('button', { class: 'b g s', text: 'Набор для Smartcat: KK KY TG KA HY UZ AZ EN', title: 'Отметить языки, которые отправляем в Smartcat', onclick: function () {
        var inputs = Array.prototype.slice.call(langsBox.querySelectorAll('input'));
        var pick = mtPick(inputs.map(function (i) { return i.value; }));
        inputs.forEach(function (i) { i.checked = pick.indexOf(i.value) >= 0; });
      } })
    ]),
    langsBox,
    el('label', { class: 'muted blk' }, [fuzzy, ' включать строки «требует правки»']),
    el('label', { class: 'muted blk' }, [pluralsJson, ' плюралки (множественное число) — отдельным .json, как у нас принято']),
    el('h2', { text: 'Как разложить файлы в архиве' }),
    layoutBox,
    el('label', { class: 'muted blk' }, [englishApart, ' английский всегда отдельно — в папку «Английский ШТАТ»']),
    el('label', { class: 'muted blk' }, [byPlatform, ' по платформам: отдельный zip на каждую — ДДММГГ_web.zip / ДДММГГ_iOS.zip / ДДММГГ_android.zip']),
    el('label', { class: 'muted blk' }, [skipEnglish, ' английский не скачивать — он уходит в Smartcat (шаг «4. Отправить в Smartcat»)']),
    el('div', { class: 'row' }, [goBtn]),
    err2
  ]);
  var resSec = el('div', { class: 'hide' }, [el('h2', { text: '3. Результат' }), progText, el('div', { class: 'bar' }, [barFill]), results]);

  /* ----- наборы: сохранить ссылки (и языки) под именем и выбирать из списка ----- */
  function presetBar(storeKey, builtin, getState, applyState) {
    var sel = el('select', { class: 'presel' });
    function own() { try { return JSON.parse(sget(storeKey) || '[]'); } catch (e) { return []; } }
    function all() { return builtin.concat(own()); }
    function find(name) { return all().filter(function (x) { return x.name === name; })[0]; }
    var delBtn = el('button', { class: 'b g s', text: 'Удалить набор', onclick: function () {
      var p = find(sel.value);
      if (!p || p.builtin || !confirm('Удалить набор «' + p.name + '»?')) return;
      sset(storeKey, JSON.stringify(own().filter(function (x) { return x.name !== p.name; })));
      refresh('');
    } });
    function refresh(selected) {
      sel.textContent = '';
      sel.appendChild(el('option', { value: '', text: '— выбрать набор —' }));
      all().forEach(function (p) { sel.appendChild(el('option', { value: p.name, text: p.name + (p.builtin ? ' (стандартный)' : '') })); });
      sel.value = selected || '';
      var p = find(sel.value);
      delBtn.classList.toggle('hide', !p || !!p.builtin);
    }
    sel.addEventListener('change', function () { var p = find(sel.value); if (p) applyState(p); refresh(sel.value); });
    var saveBtn = el('button', { class: 'b g s', text: '💾 Сохранить как набор', onclick: function () {
      var cur = find(sel.value);
      var name = prompt('Название набора (например: Портал продавца)', cur && !cur.builtin ? cur.name : '');
      if (!name || !name.trim()) return;
      name = name.trim();
      if (builtin.some(function (b) { return b.name === name; })) { alert('Так называется стандартный набор — выбери другое название'); return; }
      var list = own().filter(function (x) { return x.name !== name; });
      list.push(Object.assign({ name: name }, getState()));
      sset(storeKey, JSON.stringify(list));
      refresh(name);
    } });
    refresh('');
    return el('div', { class: 'row' }, [el('span', { class: 'muted', text: 'Набор:' }), sel, saveBtn, delBtn]);
  }
  var exportPresets = presetBar('wlx_presets_exp', [], function () {
    var checked = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    var prev = null;
    try { prev = JSON.parse(sget('wlx_langs') || 'null'); } catch (e) {}
    return { links: links.value, langs: checked.length ? checked : (prev || []) };
  }, function (p) {
    links.value = p.links || '';
    if (p.langs && p.langs.length) {
      sset('wlx_langs', JSON.stringify(p.langs));
      langsBox.querySelectorAll('input').forEach(function (i) { i.checked = p.langs.indexOf(i.value) >= 0; });
    }
    info.textContent = 'Набор «' + p.name + '»: нажми «Загрузить языки» — языки отметятся сами';
  });

  var exportPane = el('div', {}, [
    el('p', { class: 'sub', text: 'Ссылки → языки → «Выгрузить». На выходе .po по каждому компоненту и языку, в архиве — как удобнее: по компонентам, по языкам или всё вместе.' }),
    el('h2', { text: '1. Ссылки на компоненты' }),
    exportPresets,
    links,
    el('div', { class: 'row' }, [loadBtn, clearBtn, restoreBtn, info]),
    err1,
    compList,
    langSec,
    resSec
  ]);

  /* ----- import pane ----- */
  function select(options, value) {
    var sel = el('select');
    options.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    sel.value = value;
    return sel;
  }
  function savedOr(k, def) { var v = sget(k); return v === null ? def : v; }
  var fileInput = el('input', { type: 'file', multiple: '', accept: '.po,.json,.zip' });
  var drop = el('label', { class: 'drop' }, [fileInput, el('div', { text: 'Перетащи сюда .po, .json (плюралки) или .zip от подрядчика — или нажми, чтобы выбрать' })]);
  var preview = el('div');
  var errU = el('div', { class: 'err' });
  var optMethod = select([['translate', 'Добавить как перевод'], ['suggest', 'Добавить как предложение'], ['fuzzy', 'Добавить перевод как «На правку»']], savedOr('wlx_m', 'translate'));
  var optFuzzy = select([['approve', 'Импортировать как переведённое'], ['process', 'Импортировать как «На правку»'], ['', 'Не импортировать']], savedOr('wlx_f', 'approve'));
  var optConf = select([['replace-approved', 'Изменять переведённые и одобренные строки'], ['replace-translated', 'Изменять переведённые строки'], ['', 'Изменять только непереведённые строки']], savedOr('wlx_c', 'replace-approved'));
  var upBtn = el('button', { class: 'b big', text: 'Загрузить в Weblate', onclick: runUpload });
  var varSkip = el('input', { type: 'checkbox' });
  varSkip.checked = sget('wlx_varskip') !== '0';
  varSkip.addEventListener('change', function () { sset('wlx_varskip', varSkip.checked ? '1' : '0'); renderPreview(); });
  var upResults = el('div', { class: 'blk' });
  var upSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Как загружать' }),
    el('div', { class: 'opts' }, [
      el('label', {}, ['Режим загрузки файла', optMethod]),
      el('label', {}, ['Обработка строк, отмеченных «На правку»', optFuzzy]),
      el('label', {}, ['Разрешение конфликтов', optConf])
    ]),
    el('p', { class: 'muted', text: 'Машинный перевод из Smartcat (вкладка «🤖 Smartcat») эти настройки не использует — он всегда загружается с «Добавить как перевод» и «Изменять только непереведённые строки».' }),
    el('p', { class: 'muted', text: '«Заменить существующий файл перевода» здесь нет специально: в файлах только часть строк, и замена стёрла бы остальные переводы.' }),
    el('label', { class: 'muted blk' }, [varSkip, ' строки с ошибкой не загружать — сломанная или лишняя переменная ({{cuont}}, {{count}…) или мусор от машперевода (пояснения, «context:», «Usually…», примечания в скобках) — остальное загрузится']),
    el('div', { class: 'row' }, [upBtn]),
    upResults
  ]);
  var importPane = el('div', { class: 'hide' }, [
    el('p', { class: 'sub', text: 'Файлы от подрядчиков → проверка → «Загрузить в Weblate». Компонент и язык определяются сами. Машинный перевод из Smartcat загружается на вкладке «🤖 Smartcat».' }),
    el('h2', { text: '1. Файлы от подрядчиков' }),
    drop, errU,
    preview, upSec
  ]);

  /* ----- вкладка «Smartcat»: стандартный набор одной кнопкой ----- */
  var SC_DEFAULT_LINKS = 'https://weblate.wb.ru/projects/global_site/wb-android/\nhttps://weblate.wb.ru/projects/global_site/wb-ios_new/';
  var scLinks = el('textarea', { class: 'small' });
  scLinks.value = sget('wlx_mt_links') || SC_DEFAULT_LINKS;
  var scRun = el('button', { class: 'b big', text: 'Выгрузить непереведённое', onclick: function () { runScPreset(false); } });
  var scRunSend = el('button', { class: 'b big', text: '🚀 Выгрузить и отправить в Smartcat', title: 'Выгрузить и сразу отправить в Smartcat. Когда перевод будет готов, придёт уведомление Chrome.',
    onclick: function () { runScPreset(true); } });
  var scPresets = presetBar('wlx_presets_sc', [{ name: 'Магазинка: андроид + айос', links: SC_DEFAULT_LINKS, builtin: true }], function () {
    return { links: scLinks.value.trim() };
  }, function (p) {
    scLinks.value = p.links || SC_DEFAULT_LINKS;
    sset('wlx_mt_links', p.links === SC_DEFAULT_LINKS ? '' : p.links);
  });
  var scProg = el('div', { class: 'muted' });
  var scBar = el('div');
  var scOut = el('div');
  var scBack = el('div', { class: 'scimp card hide' });
  /* сетап Smartcat — быстрый выбор прямо на вкладке */
  var scSetupQuick = el('select', { class: 'presel' });
  var scSetupNote = el('span', { class: 'muted' });
  /* забрать готовые переводы из любого проекта Smartcat (не только из отправленного расширением) */
  var scImpProject = el('input', { type: 'text', placeholder: 'ссылка на проект в Smartcat; пусто — проект из сетапа' });
  var scImpFilter = el('input', { type: 'text', placeholder: 'фильтр по имени файла, например wb-web (необязательно)' });
  var scImpMsg = el('span', { class: 'muted' });
  var scImpList = el('div');
  var scImpBtn = el('button', { class: 'b g s', text: '🔄 Обновить', onclick: function () { listScFiles(); } });
  var scImpMode = select([['', 'только в непереведённые строки'], ['replace-translated', 'заменять и переведённые строки']], sget('wlx_scimp_mode') || '');
  scImpMode.className = 'presel';
  scImpMode.addEventListener('change', function () { sset('wlx_scimp_mode', scImpMode.value); });
  var scImpBody = el('div', { class: 'hide' }, [
    el('div', { class: 'row' }, [scImpMsg, scImpBtn]),
    scImpList
  ]);
  scImpBtn.style.marginLeft = 'auto';
  var scImpOpen = el('button', { class: 'b s', text: 'Открыть', onclick: function () {
    var open = scImpBody.classList.toggle('hide') === false;
    scImpOpen.textContent = open ? 'Свернуть' : 'Открыть';
    scImpOpen.className = open ? 'b g s' : 'b s';
    if (open && !scImpList.childNodes.length) listScFiles();
  } });
  var scImpBox = el('div', { class: 'scimp card' }, [
    el('div', { class: 'head' }, [el('h3', { text: '3. Готовые файлы из Smartcat → в Weblate' }), scImpOpen]),
    el('p', { class: 'hint', text: 'Все проекты Smartcat → папки → файлы, даже если файлы грузили руками (например, веб). Можно и файлы, которые ещё в работе.' }),
    scImpBody
  ]);
  scImpProject.style.flex = '1'; scImpProject.style.minWidth = '240px'; scImpProject.style.margin = '0';
  scRun.textContent = HAS_EXT ? 'Только скачать ZIP' : 'Выгрузить непереведённое';
  scRun.className = HAS_EXT ? 'b g' : 'b big';
  var scPane = el('div', { class: 'hide' }, [
    HAS_EXT ? el('div', { class: 'setrow' }, ['Сетап:', scSetupQuick, scSetupNote]) : null,
    el('div', { class: 'card' }, [
      el('h3', { text: '1. На машинный перевод' }),
      el('p', { class: 'hint', text: 'Непереведённое из компонентов (по умолчанию android и ios) на KK KY TG KA HY UZ AZ EN → ZIP и Smartcat. AZ — обычный (не N11), и для android, и для ios.' }),
      el('div', { class: 'row' }, HAS_EXT ? [scRunSend, scRun] : [scRun]),
      el('details', {}, [el('summary', { text: 'Компоненты и наборы' }),
        scPresets,
        scLinks,
        el('div', { class: 'row' }, [el('button', { class: 'b g s', text: 'Вернуть стандартные', onclick: function () { scLinks.value = SC_DEFAULT_LINKS; sset('wlx_mt_links', ''); } })])]),
      el('div', { class: 'hide', id: 'wlx-sc-prog' }, [scProg, el('div', { class: 'bar' }, [scBar])]),
      scOut
    ]),
    scBack,
    HAS_EXT ? scImpBox : null
  ]);
  function docReady(d) {
    if (d.documentDisassemblingStatus && d.documentDisassemblingStatus !== 'success') return false;
    if (String(d.status || '').toLowerCase() === 'completed') return true;
    var st = d.workflowStages || [];
    return st.length > 0 && st.every(function (x) { return (x.progress || 0) >= 100; });
  }
  function docProgress(d) {
    var st = d.workflowStages || [];
    return st.length ? Math.round(Math.min.apply(null, st.map(function (x) { return x.progress || 0; }))) : null;
  }
  /* блок 3: все проекты → папки → файлы */
  var scProjCache = null, scOpenPr = null;
  function listScFiles() {
    if (scOpenPr) return openScProject(scOpenPr.id);
    return listScProjects(true);
  }
  function scGuard() {
    return loadScConfig().then(function (c) { if (!c || !c.accountId || !c.hasKey) throw new Error('Smartcat не подключён (⚙)'); return c; });
  }
  function listScProjects(reload) {
    scOpenPr = null;
    scImpBtn.disabled = true; scImpList.textContent = ''; scImpMsg.className = 'muted'; scImpMsg.textContent = 'Загружаю проекты…';
    var cfg;
    scGuard().then(function (c) {
      cfg = c;
      return scProjCache && !reload ? scProjCache : scCall('sc-projects').then(function (l) { scProjCache = l; return l; });
    }).then(function (list) {
      /* проект из сетапа — наверх */
      var ref = String(cfg.project || SC_PROJECT_DEFAULT), idm = /([0-9a-f]{8}-[0-9a-f-]{27,})/i.exec(ref);
      var pin = list.filter(function (p) { return idm ? p.id === idm[1] : p.name === ref; })[0];
      renderScProjects(pin ? [pin].concat(list.filter(function (p) { return p !== pin; })) : list, pin);
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; })
      .then(function () { scImpBtn.disabled = false; });
  }
  function renderScProjects(list, pin) {
    scImpList.textContent = '';
    scImpMsg.className = 'muted'; scImpMsg.textContent = 'Проектов: ' + list.length;
    var tbody = el('tbody');
    var crumbs = el('div', { class: 'crumbs' }, [el('b', { text: '📂 Все проекты Smartcat' })]);
    function draw() {
      tbody.textContent = '';
      var raw = scImpFilter.value.trim(), q = raw.toLowerCase().split(/\s+/).filter(Boolean);
      var idm = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(raw);
      if (idm) {
        var tr0 = el('tr', { class: 'folder' }, [el('td', {}, [el('b', { text: '🔗 Открыть проект по ссылке' })]), el('td', { colspan: '3', class: 'muted', text: idm[1] })]);
        tr0.addEventListener('click', function () { openScProject(idm[1]); });
        tbody.appendChild(tr0);
      }
      var shown = 0;
      list.forEach(function (p) {
        if (q.length && !idm && !q.every(function (w) { return String(p.name).toLowerCase().indexOf(w) >= 0; })) return;
        if (idm && p.id !== idm[1]) return;
        if (++shown > 300) return;
        var d = Date.parse(p.modified || p.created || '');
        var tr = el('tr', { class: 'folder', title: 'Открыть проект' }, [
          el('td', {}, [el('b', { text: (p === pin ? '⭐ ' : '📁 ') + p.name })]),
          el('td', { class: 'muted', text: (p.targetLanguages || []).length ? p.targetLanguages.length + ' яз.' : '' }),
          el('td', { class: 'muted', text: d ? new Date(d).toLocaleDateString('ru-RU') : '' }),
          el('td', { class: String(p.status).toLowerCase() === 'completed' ? 'ok' : 'muted', text: projStatus(p.status) })]);
        tr.addEventListener('click', function () { openScProject(p.id); });
        tbody.appendChild(tr);
      });
      if (shown > 300) tbody.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'muted', text: 'и ещё ' + (shown - 300) + ' — уточни поиск' })]));
      if (!tbody.childNodes.length) tbody.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'muted', text: 'Ничего не нашлось' })]));
    }
    scImpFilter.value = '';
    scImpFilter.oninput = draw;
    scImpFilter.placeholder = '🔍 поиск проекта по названию — или вставь ссылку на проект';
    scImpList.appendChild(scImpFilter);
    scImpList.appendChild(crumbs);
    scImpList.appendChild(el('div', { class: 'ftable' }, [el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', { text: 'Проект' }), el('th', { text: 'Языки' }), el('th', { text: 'Изменён' }), el('th', { text: 'Статус' })])]), tbody])]));
    draw();
  }
  function projStatus(s) {
    s = String(s || '').toLowerCase();
    return { created: 'создан', inprogress: 'в работе', completed: '✓ завершён', canceled: 'отменён', cancelled: 'отменён' }[s] || s;
  }
  function openScProject(id) {
    scImpBtn.disabled = true; scImpMsg.className = 'muted'; scImpMsg.textContent = 'Открываю проект…';
    scGuard().then(function () { return scCall('sc-project', { id: id }); }).then(function (full) {
      scOpenPr = { id: full.id || id, name: full.name || id };
      scImpFilter.value = '';
      renderScFiles(scOpenPr, full.documents || []);
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; })
      .then(function () { scImpBtn.disabled = false; });
  }
  /* файлы проекта как в Smartcat: папки и файлы вне папок, клик по папке — внутрь; поиск — по всем файлам */
  /* что уже загружено в Weblate из блока 3 — по id документа Smartcat (на этом компьютере) */
  function scDone() { try { return JSON.parse(sget('wlx_scdone') || '{}'); } catch (e) { return {}; } }
  function markScDone(todo) {
    var m = scDone(), now = new Date().toISOString(), ch = 0;
    todo.forEach(function (u) { if (u.sent && u.scDocId) { m[u.scDocId] = now; ch++; } });
    if (!ch) return;
    var keys = Object.keys(m);
    if (keys.length > 20000) keys.sort(function (a, b) { return m[a] < m[b] ? -1 : 1; }).slice(0, keys.length - 20000).forEach(function (k) { delete m[k]; });
    sset('wlx_scdone', JSON.stringify(m));
    if (scImpRedraw) scImpRedraw();
  }
  function shortDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2); }
  var scImpRedraw = null, scImpRes = null, scImpUnpick = null;
  var scImpHide = el('input', { type: 'checkbox' });
  scImpHide.checked = sget('wlx_scimp_hide') === '1';
  scImpHide.addEventListener('change', function () { sset('wlx_scimp_hide', scImpHide.checked ? '1' : '0'); if (scImpRedraw) scImpRedraw(); });
  function renderScFiles(pr, docs) {
    scImpList.textContent = '';
    var readyN = docs.filter(docReady).length;
    scImpMsg.className = 'muted';
    scImpMsg.textContent = 'Проект «' + pr.name + '»: файлов ' + docs.length + ', готово ' + readyN;
    if (!docs.length) return;
    var files = docs.map(function (d) {
      var path = String(d.fullPath || d.path || '').replace(/^\/+/, ''), i = path.lastIndexOf('/'), t = Date.parse(d.creationDate || d.created || '');
      var folder = i > 0 ? path.slice(0, i) : '';
      return { d: d, t: t || 0, folder: folder, parts: folder ? folder.split('/') : [], day: t ? new Date(t).toLocaleDateString('ru-RU') : '',
        hay: (d.name + ' ' + d.targetLanguage + ' ' + folder + ' ' + (t ? new Date(t).toLocaleDateString('ru-RU') : '')).toLowerCase() };
    }).sort(function (a, b) { return a.d.name.localeCompare(b.d.name) || String(a.d.targetLanguage).localeCompare(String(b.d.targetLanguage)); });
    var picked = {}, cur = [];
    var under = function (path) { return files.filter(function (f) { return path.every(function (p, k) { return f.parts[k] === p; }); }); };
    var cbAll = el('input', { type: 'checkbox', title: 'Отметить всё, что видно' });
    var crumbs = el('div', { class: 'crumbs' });
    var tbody = el('tbody');
    var count = el('span', { class: 'muted' });
    var goBtn = el('button', { class: 'b', onclick: function () { takeScFiles(sel(), goBtn, true); } });
    var takeBtn = el('button', { class: 'b g', text: 'Сначала посмотреть', onclick: function () { takeScFiles(sel(), takeBtn, false); } });
    var zipBtn = el('button', { class: 'b g', text: '⬇ Скачать ZIP', title: 'Скачать отмеченные с именами как в Weblate (по папкам компонентов)', onclick: function () { takeScFiles(sel(), zipBtn, 'zip'); } });
    var clearBtn = el('button', { class: 'b g s', text: 'Снять всё', onclick: function () { picked = {}; draw(); } });
    function sel() { return files.filter(function (f) { return picked[f.d.id]; }).map(function (f) { return f.d; }); }
    function setMany(list, on) { list.forEach(function (f) { if (on) picked[f.d.id] = 1; else delete picked[f.d.id]; }); }
    function state(cb, list) {
      var n = list.filter(function (f) { return picked[f.d.id]; }).length;
      cb.checked = list.length > 0 && n === list.length; cb.indeterminate = n > 0 && n < list.length;
    }
    function status(list) {
      var r = list.filter(function (f) { return docReady(f.d); }).length;
      return r === list.length ? '✓ готово' : 'готово ' + r + ' из ' + list.length;
    }
    var visible = [], done = scDone();
    function isDone(f) { return !!done[f.d.id]; }
    function shown(list) { return scImpHide.checked ? list.filter(function (f) { return !isDone(f); }) : list; }
    function draw() {
      done = scDone();
      tbody.textContent = ''; crumbs.textContent = ''; visible = [];
      var q = scImpFilter.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (q.length) {
        /* поиск: все подходящие файлы из всех папок */
        crumbs.appendChild(el('a', { href: '#', text: '📂 Все проекты', onclick: function (e) { e.preventDefault(); listScProjects(false); } }));
        crumbs.appendChild(el('span', { class: 'muted', text: ' › ' + pr.name + ' — найдено по всему проекту:' }));
        /* сначала папки (по названию), потом файлы */
        var paths = {};
        files.forEach(function (f) { f.parts.forEach(function (x, k) { paths[f.parts.slice(0, k + 1).join('/')] = 1; }); });
        Object.keys(paths).filter(function (path) { var low = path.toLowerCase(); return q.every(function (w) { return low.indexOf(w) >= 0; }); })
          .sort().forEach(function (path) { folderRow(path.split('/'), path); });
        shown(files.filter(function (f) { return q.every(function (w) { return f.hay.indexOf(w) >= 0; }); })).forEach(function (f) { fileRow(f, true); });
      } else {
        crumbs.appendChild(el('a', { href: '#', text: '📂 Все проекты', onclick: function (e) { e.preventDefault(); listScProjects(false); } }));
        crumbs.appendChild(document.createTextNode(' › '));
        var home = cur.length ? el('a', { href: '#', text: pr.name, onclick: function (e) { e.preventDefault(); cur = []; draw(); } }) : el('b', { text: pr.name });
        crumbs.appendChild(home);
        cur.forEach(function (p, k) {
          crumbs.appendChild(document.createTextNode(' › '));
          crumbs.appendChild(k === cur.length - 1 ? el('b', { text: p })
            : el('a', { href: '#', text: p, onclick: function (e) { e.preventDefault(); cur = cur.slice(0, k + 1); draw(); } }));
        });
        var here = under(cur), subs = {};
        here.forEach(function (f) { if (f.parts.length > cur.length) (subs[f.parts[cur.length]] = subs[f.parts[cur.length]] || []).push(f); });
        Object.keys(subs).sort(function (a, b) {
          var ta = Math.max.apply(null, subs[a].map(function (f) { return f.t; })), tb = Math.max.apply(null, subs[b].map(function (f) { return f.t; }));
          return tb - ta || b.localeCompare(a);
        }).forEach(function (name) { folderRow(cur.concat([name]), name); });
        shown(here.filter(function (f) { return f.parts.length === cur.length; })).forEach(function (f) { fileRow(f, false); });
        if (!tbody.childNodes.length) tbody.appendChild(el('tr', {}, [el('td', { colspan: '5', class: 'muted', text: 'Пусто' })]));
      }
      state(cbAll, visible);
      var n = sel().length;
      count.textContent = 'отмечено файлов: ' + n;
      goBtn.textContent = '⬆ Загрузить в Weblate (' + n + ')';
      goBtn.disabled = takeBtn.disabled = zipBtn.disabled = !n;
      clearBtn.classList.toggle('hide', !n);
    }
    function folderRow(path, label) {
      var all = under(path), list = shown(all), cb = el('input', { type: 'checkbox', title: 'Отметить всю папку' });
      if (!list.length) return;                                      // всё загружено и скрыто
      var dn = all.filter(isDone), last = dn.map(function (f) { return done[f.d.id]; }).sort().pop();
      var badge = dn.length === all.length ? el('span', { class: 'badge b-ok', text: '✓ в Weblate ' + fmtDate(last) })
        : dn.length ? el('span', { class: 'badge b-part', text: 'загружено ' + dn.length + ' из ' + all.length }) : el('span', { class: 'badge b-new', text: 'новое' });
      state(cb, list); visible = visible.concat(list.filter(function (f) { return visible.indexOf(f) < 0; }));
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { setMany(list, cb.checked); draw(); });
      var langs = list.map(function (f) { return f.d.targetLanguage; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      var tr = el('tr', { class: 'folder' + (dn.length === all.length ? ' done' : ''), title: 'Открыть папку' }, [el('td', {}, [cb]), el('td', {}, [el('b', { text: '📁 ' + label }), badge]),
        el('td', { class: 'muted', text: langs.length === 1 ? langs[0] : langs.length + ' яз.' }),
        el('td', { class: 'muted', text: 'файлов ' + all.length }),
        el('td', { class: all.every(function (f) { return docReady(f.d); }) ? 'ok' : 'muted', text: status(all) })]);
      tr.addEventListener('click', function () { cur = path.slice(); scImpFilter.value = ''; draw(); });
      tbody.appendChild(tr);
    }
    function fileRow(f, withPath) {
      if (visible.indexOf(f) < 0) visible.push(f);
      var cb = el('input', { type: 'checkbox' }), ok = docReady(f.d), pg = docProgress(f.d);
      cb.checked = !!picked[f.d.id];
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { setMany([f], cb.checked); draw(); });
      var tr = el('tr', isDone(f) ? { class: 'done' } : {}, [el('td', {}, [cb]),
        el('td', {}, [document.createTextNode(scDocKey(f.d.name)), isDone(f) ? el('span', { class: 'badge b-ok', text: '✓ ' + shortDate(done[f.d.id]), title: 'загружено в Weblate ' + fmtDate(done[f.d.id]) }) : null]),
        el('td', { text: f.d.targetLanguage || '' }),
        el('td', { class: 'muted', text: withPath ? [f.folder ? '📁 ' + f.folder : '', f.day].filter(Boolean).join(' · ') : f.day }),
        el('td', { class: ok ? 'ok' : 'muted', text: ok ? '✓ готово' : 'в работе' + (pg != null ? ' ' + pg + '%' : '') })]);
      tr.addEventListener('click', function () { setMany([f], !picked[f.d.id]); draw(); });
      tbody.appendChild(tr);
    }
    cbAll.addEventListener('change', function () { setMany(visible, cbAll.checked); draw(); });
    scImpFilter.oninput = draw;
    scImpFilter.placeholder = '🔍 поиск по папкам и файлам проекта — например «280926» или «wb-web kk»';
    var t = el('table', {}, [el('thead', {}, [el('tr', {}, [el('th', {}, [cbAll]), el('th', { text: 'Имя' }), el('th', { text: 'Язык' }), el('th', { text: 'Дата / файлов' }), el('th', { text: 'Статус' })])]), tbody]);
    scImpList.appendChild(scImpFilter);
    scImpList.appendChild(crumbs);
    scImpList.appendChild(el('div', { class: 'ftable' }, [t]));
    scImpList.appendChild(el('div', { class: 'row' }, [el('label', { class: 'chk' }, [scImpHide, 'скрыть уже загруженное'])]));
    scImpList.appendChild(el('div', { class: 'row' }, [el('span', { class: 'muted', text: 'Как загружать:' }), scImpMode, count, clearBtn]));
    scImpList.appendChild(el('div', { class: 'row' }, [goBtn, takeBtn, zipBtn]));
    scImpRes = el('div', { class: 'res hide' });
    scImpList.appendChild(scImpRes);
    scImpRedraw = draw;
    scImpUnpick = function (ids) { ids.forEach(function (id) { delete picked[id]; }); draw(); };
    draw();
  }
  /* скачать отмеченные документы и положить в «Загрузить обратно» как обычные файлы */
  /* загрузка из блока 3 с результатом прямо здесь, без перехода на другую вкладку */
  function inlineUpload(found) {
    var box = scImpRes;
    if (!box) return;
    box.classList.remove('hide'); box.textContent = '';
    var line = el('div', { class: 'line', text: 'Загружаю…' }), fill = el('div');
    box.appendChild(line); box.appendChild(el('div', { class: 'bar' }, [fill]));
    scImpMsg.className = 'muted'; scImpMsg.textContent = 'Забрала ' + found.length + ' файл(ов) из Smartcat — загружаю, результат ниже';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    var skipped = found.filter(function (u) { return u.error || u.skip; });
    runUpload(function (u) { return found.indexOf(u) >= 0; }, {
      tick: function (ok, bad, total, took) {
        fill.style.width = Math.round(100 * (ok + bad) / Math.max(1, total)) + '%';
        line.textContent = 'Загружаю: ' + (ok + bad) + ' из ' + total + ' · ' + took + ' — Weblate обрабатывает файлы одного компонента по очереди';
      },
      fail: function (e) { line.className = 'line red'; line.textContent = '✗ ' + friendly(e); },
      done: function (todo, opts, took) {
        box.textContent = '';
        var sentIds = todo.filter(function (u) { return u.sent && u.scDocId; }).map(function (u) { return u.scDocId; });
        if (scImpUnpick) scImpUnpick(sentIds);
        scImpMsg.className = todo.some(function (u) { return !u.sent; }) ? 'red' : 'ok';
        scImpMsg.textContent = todo.length ? 'Готово — результат ниже' : 'Загружать нечего';
        var sent = todo.filter(function (u) { return u.sent; }), failed = todo.filter(function (u) { return !u.sent; });
        var acc = sent.reduce(function (a, u) { return a + (Number(u.accepted) || 0); }, 0);
        var where = function (u) { return u.c + ' · ' + langName(u.lang); };
        var srch = function (u, key) { return '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent('context:"' + key + '"'); };
        if (!todo.length) box.appendChild(el('div', { class: 'line', text: 'Загружать нечего — причины в списке на вкладке «⬆ Загрузить обратно»' }));
        else box.appendChild(el('div', { class: 'line' }, [el('b', { text: (failed.length ? '' : '✓ ') + 'Загружено ' + sent.length + ' из ' + todo.length }),
          document.createTextNode(' · строк принято ' + acc.toLocaleString('ru-RU') + ' · ' + took)]));
        box.appendChild(el('div', { class: 'bar' }, [el('div', { style: 'width:100%' })]));
        if (failed.length) box.appendChild(el('div', { class: 'line red', text: '✗ С ошибкой ' + failed.length + ': ' +
          failed.map(function (u) { return where(u) + ' — ' + (u.upError || 'не загружено'); }).join('; ') }));
        if (skipped.length) box.appendChild(el('div', { class: 'line muted', text: 'Пропущено ' + skipped.length + ': ' +
          skipped.map(function (u) { return (u.c ? where(u) : u.name.split('/').pop()) + ' — ' + (u.error || u.skip); }).join('; ') }));
        var fx = sent.filter(function (u) { return u.fixedKeys && u.fixedKeys.length; });
        if (fx.length) {
          var keys = {};
          fx.forEach(function (u) { u.fixedKeys.forEach(function (k) { (keys[k] = keys[k] || []).push(u); }); });
          var ln = el('div', { class: 'line' }, [document.createTextNode('⚠ Смарткат испортил строки — убрала, остальное загружено: ')]);
          Object.keys(keys).forEach(function (k, i) {
            if (i) ln.appendChild(document.createTextNode(', '));
            ln.appendChild(el('a', { href: srch(keys[k][0], k), target: '_blank', text: k }));
            ln.appendChild(document.createTextNode(' (' + keys[k][0].c + ', ' + keys[k].length + ' яз.)'));
          });
          box.appendChild(ln);
        }
        var vs = sent.filter(function (u) { return u.varSkipped; });
        if (vs.length) box.appendChild(el('div', { class: 'line red', text: '✗ Переменные: не загружено строк ' + vs.reduce(function (a, u) { return a + u.varSkipped; }, 0) +
          ' (сломанная или лишняя переменная) — список на вкладке «⬆ Загрузить обратно»' }));
        var der = sent.filter(function (u) { return u.derived; });
        if (der.length) box.appendChild(el('div', { class: 'line', text: 'ℹ Плюралки вынесла в .json: ' +
          der.map(function (u) { return u.c; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + ' (' + der.length + ' файл.)' }));
        var prob = sent.filter(function (u) { return u.upSkipped || u.notFound; });
        if (prob.length) { var pd = el('details', {}, [el('summary', { text: 'Какие строки не легли — файлов: ' + prob.length })]); box.appendChild(pd); explainAll(prob, pd); }
        if (todo.length) {
          var ft = el('table', {}, [el('tr', {}, [el('th', { text: 'Файл' }), el('th', { text: 'Куда' }), el('th', { text: 'Статус' })])]);
          todo.forEach(function (u) { ft.appendChild(el('tr', {}, [el('td', { text: u.name.split('/').pop() }), el('td', { text: where(u) }), el('td', { class: u.sent ? 'ok' : 'red', text: u.status || '' })])); });
          box.appendChild(el('details', {}, [el('summary', { text: 'По файлам — ' + todo.length }), ft]));
          box.appendChild(el('details', {}, [el('summary', { text: 'Полный отчёт' }), uploadReport(todo, opts || {}, took)]));
        }
        box.appendChild(el('div', { class: 'row' }, [el('button', { class: 'b g s', text: 'Открыть на вкладке «⬆ Загрузить обратно»', onclick: function () { tab('imp'); } })]));
      }
    });
  }
  /* скачать отмеченное архивом с именами как в Weblate: <компонент>/global_site-<компонент>-<язык>.po, <компонент>_<язык>_plural form.json */
  function zipScFiles(found) {
    var files = [], bad = 0;
    found.forEach(function (u) {
      var json = /\.json$/i.test(u.name), text = u.orig || u.text || '';
      if (u.p && u.c && u.lang && !u.error) {
        files.push({ name: fileKey(u.c) + '/' + poName({ p: u.p, component: u.c, language: u.lang, ext: json ? 'json' : 'po' }), text: text });
      } else { bad++; files.push({ name: 'не распознано/' + (u.scName || u.name.split('/').pop()) + (json ? '.json' : '.po'), text: text }); }
    });
    files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    saveBlob(makeZip(files), 'smartcat_' + today() + '.zip');
    scImpMsg.className = bad ? 'red' : 'ok';
    scImpMsg.textContent = '✓ Скачан архив: ' + (files.length - bad) + ' файл(ов) с именами как в Weblate' + (bad ? ', не распознано: ' + bad + ' (папка «не распознано»)' : '');
  }
  function takeScFiles(docs, btn, upload) {
    if (!docs.length) return;
    btn.disabled = true; scImpMsg.className = 'muted';
    var n = 0, found = [];
    scImpMsg.textContent = 'Скачиваю 0 из ' + docs.length + '…';
    pool(docs, 3, function (d) {
      var lang = String(d.targetLanguage || ''), base = scDocKey(d.name).replace(/\s*\(\d+\)$/, '').replace(/\([^)]*\)$/, '');
      /* язык в конце имени («b2b.en», «…-kk») убираем — язык берём из Smartcat */
      var lm = /^(.+)[._-]([a-z]{2,3})(?:[_-][A-Za-z0-9]+)?$/i.exec(base);
      if (lm && [baseLang(lang), 'ru', 'en'].indexOf(lm[2].toLowerCase()) >= 0) base = lm[1];
      if (lang) base += '-' + lang.replace(/-/g, '_');
      var path = String(d.fullPath || d.path || '').replace(/^\/+/, ''), cut = path.lastIndexOf('/');
      var dir = cut > 0 ? path.slice(0, cut).split('/').pop() : '';
      return scCall('sc-export', { documentId: d.id }).then(function (r) {
        var json = /^\s*[\[{]/.test(r.text);
        return detect({ name: 'Smartcat/' + (dir ? dir + '/' : '') + base + (json ? '.json' : '.po'), text: r.text }).then(function (u) { u.orig = r.text; u.scName = scDocKey(d.name); return u; });
      }).then(function (u) {
        /* AZ на машпереводе android/ios: в Smartcat это az-Latn, а в Weblate — обычный az (не az_Latn, не N11) */
        if (!u.error && u.p && u.c && baseLang(lang) === 'az' && scPlatform(u.p, u.c) !== 'web') {
          return withTranslations(u.p, u.c).then(function (w) {
            var code = w && matchLanguage('az', w.trs);
            if (code) u.lang = code;
            return u;
          });
        }
        /* язык берём из Smartcat, если в файле указан другой */
        if (!u.error && u.p && u.c && lang && (!u.lang || baseLang(u.lang) !== baseLang(lang))) {
          return withTranslations(u.p, u.c).then(function (w) {
            var code = w && (matchLanguage(lang.replace(/-/g, '_'), w.trs) || matchLanguage(baseLang(lang), w.trs));
            if (code) u.lang = code; else u.error = 'языка ' + lang + ' нет в компоненте «' + u.c + '»';
            return u;
          });
        }
        return u;
      }, function (e) { return { name: 'Smartcat/' + base + '.po', text: '', filled: 0, total: 0, error: e.message, scName: scDocKey(d.name), scDocId: d.id }; }).then(function (u) {
        u.note = 'из Smartcat';
        u.scImp = true;
        u.scDocId = d.id;
        /* Smartcat отдаёт неподтверждённое как «требует правки» — считаем строки с текстом, импортируем как переведённые */
        if (!u.error && !/\.json$/i.test(u.name)) {
          var inf = poInfo(u.text);
          u.filled = inf.withText; u.total = inf.total;
          u.skip = inf.withText ? null : 'в файле из Smartcat нет переведённых строк';
        }
        u.opts = { method: 'translate', fuzzy: 'approve', conflicts: scImpMode.value };
        found.push(u);
        scImpMsg.textContent = 'Скачиваю ' + (++n) + ' из ' + docs.length + '…';
      });
    }).then(function () {
      if (upload === 'zip') return zipScFiles(found);
      return withPlurals(found);
    }).then(function (found) {
      if (!found) return;
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name); };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
      var bad = found.filter(function (u) { return u.error; }).length;
      scImpMsg.className = bad ? 'red' : 'ok';
      if (upload) { inlineUpload(found); return; }
      scImpMsg.textContent = '✓ Забрала ' + (found.length - bad) + (bad ? ', не поняла куда: ' + bad : '') +
        ' — проверь и нажми «Загрузить в Weblate» на вкладке «⬆ Загрузить обратно»' +
        (bad ? '. Для нераспознанных выбери компонент в колонке «Куда»' : '');
      tab('imp');
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* AZ — обычный az и для android, и для ios (az_N11 и подобные в набор не берём) */
  function presetLangs(x, codes) {
    var rest = codes.filter(function (c) { return !/_n\d+$/i.test(c); });
    return mtPick(rest).concat(mtPick(rest, EXPORT_ONLY_LANGS));
  }
  function runScPreset(autoSend) {
    var text = scLinks.value.trim() || SC_DEFAULT_LINKS;
    if (text !== SC_DEFAULT_LINKS) sset('wlx_mt_links', text);
    scRun.disabled = true; scRunSend.disabled = true; scOut.textContent = '';
    var prog = scPane.querySelector('#wlx-sc-prog'); prog.classList.remove('hide');
    scBar.style.width = '0%'; scProg.textContent = 'Ищу компоненты…';
    var plan = [];
    resolveLinks(text).then(function (r) {
      if (r.missing.length) scOut.appendChild(el('div', { class: 'err', text: 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n') }));
      if (!r.comps.length) throw new Error('Не нашла ни одного компонента');
      scProg.textContent = 'Смотрю языки…';
      /* языки выбираются для каждого компонента отдельно */
      return pool(r.comps, 4, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          var codes = trs.filter(function (t) { return !t.is_source; }).map(function (t) { return t.language.code; });
          plan.push({ comp: x, langs: presetLangs(x, codes) });
        });
      });
    }).then(function () {
      plan = plan.filter(function (x) { return x.langs.length; });
      if (!plan.length) throw new Error('В компонентах нет языков из набора');
      var total = plan.reduce(function (a, x) { return a + x.langs.length; }, 0), done = 0;
      scProg.textContent = 'Скачиваю… 0 из ' + total;
      var all = { res: [], errs: [] };
      return pool(plan, 2, function (x) {
        return exportCore([x.comp], x.langs, { q: QUERY_EMPTY, wantJson: false }, function () {
          done++; scBar.style.width = Math.round(100 * done / total) + '%'; scProg.textContent = 'Скачиваю… ' + done + ' из ' + total;
        }).then(function (r) { all.res = all.res.concat(r.res); all.errs = all.errs.concat(r.errs); });
      }).then(function () { return all; });
    }).then(function (r) {
      scBar.style.width = '100%'; scProg.textContent = 'Готово!';
      showScPreset(r.res, r.errs, autoSend);
    }).catch(function (e) {
      scOut.appendChild(el('div', { class: 'err', text: friendly(e) }));
      prog.classList.add('hide');
      if (autoSend) autoDone({ error: friendly(e) });
    }).then(function () { scRun.disabled = false; scRunSend.disabled = false; });
  }

  /* служебные флаги Weblate о состоянии строки («keep-needs-editing», «fuzzy») в Smartcat не отправляем:
     с ними Smartcat может не дать машперевод; форматные флаги (java-printf-format и т. п.) оставляем */
  function scSendText(t) {
    if (/^\s*[\[{]/.test(t)) return t;
    return t.replace(/^#,(.*)$/mg, function (m, flags) {
      var keep = flags.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^(fuzzy|keep-needs-editing)$/i.test(x); });
      return keep.length ? '#, ' + keep.join(', ') : '\u0000';
    }).replace(/^\u0000\n/mg, '');
  }
  function scFileName(r) { return r.p + '-' + fileKey(r.component) + '-' + r.language + '.po'; }
  /* запуск по расписанию: «🚀 Выгрузить и отправить», итог — в фон (уведомление) */
  var scAutoHook = null;
  function autoDone(r) { if (scAutoHook) { var h = scAutoHook; scAutoHook = null; h(r); } }
  function autoSend(slot) {
    return new Promise(function (resolve) {
      scAutoHook = function (r) { r.slot = slot; scCall('sc-auto-done', r).catch(function () {}); resolve(r); };
      tab('sc'); runScPreset(true);
      setTimeout(function () { autoDone({ error: 'не дождалась конца отправки за 15 минут — проверь вкладку Smartcat' }); }, 15 * 60000);
    });
  }
  function showScPreset(res, errs, autoSend) {
    if (!res.length) { scOut.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' })); if (autoSend) autoDone({ nothing: true }); }
    else {
      var by = {}, plats = [];
      res.forEach(function (r) {
        var pl = scPlatform(r.p, r.component);
        if (plats.indexOf(pl) < 0) plats.push(pl);
        var k = pl + '|' + r.language, a = by[k] = by[k] || { pl: pl, lang: r.language, strings: 0, words: 0 };
        a.strings += r.strings; a.words += r.words;
      });
      var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Папка' }), el('th', { text: 'Язык' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' })])]);
      Object.keys(by).sort().forEach(function (k) {
        var a = by[k];
        t.appendChild(el('tr', {}, [el('td', { text: ddmmyy() + '_' + a.pl }), el('td', {}, [langLabel(a.lang)]),
          el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) })]));
      });
      scOut.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать ZIP (' + plats.sort().join(' / ') + ' отдельно)', onclick: function () {
          /* английский в архив не кладём — он уходит в Smartcat */
          var files = res.filter(function (r) { return !isEnglish(r.language); }).map(function (r) { return { name: platDir(r.p, r.component) + '/' + scFileName(r), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name); });
          saveFiles(files, 'smartcat_' + ddmmyy() + '.zip');
        } })
      ]));
      scOut.appendChild(t);
      var toSc = res.filter(function (r) { return EXPORT_ONLY_LANGS.indexOf(baseLang(r.language)) < 0; });
      var only = res.filter(function (r) { return toSc.indexOf(r) < 0; }).map(function (r) { return r.language; })
        .filter(function (x, i, a) { return a.indexOf(x) === i; });
      if (only.length) scOut.appendChild(el('p', { class: 'muted', text: only.map(langName).join(', ') + ' — только в ZIP, в Smartcat не отправляется.' }));
      if (toSc.length) renderSmartcat(toSc, scOut).then(function (sendBtn) {
        if (autoSend && sendBtn) sendBtn.click();
        else if (autoSend) { scOut.appendChild(el('div', { class: 'err', text: 'Отправить не получилось: Smartcat не подключён (⚙)' })); autoDone({ error: 'Smartcat не подключён (⚙)' }); }
      });
      else if (autoSend) autoDone({ nothing: true });
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      scOut.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
  }

  var tabExp = el('button', { class: 'tab on', text: '⬇ Выгрузить', onclick: function () { tab('exp'); } });
  var tabSc = el('button', { class: 'tab', text: '🤖 Smartcat', onclick: function () { tab('sc'); } });
  var tabImp = el('button', { class: 'tab', text: '⬆ Загрузить обратно', onclick: function () { tab('imp'); } });
  function tab(t) {
    tabExp.classList.toggle('on', t === 'exp'); tabSc.classList.toggle('on', t === 'sc'); tabImp.classList.toggle('on', t === 'imp');
    exportPane.classList.toggle('hide', t !== 'exp'); scPane.classList.toggle('hide', t !== 'sc'); importPane.classList.toggle('hide', t !== 'imp');
  }


  /* ----- настройки Smartcat (только в расширении) ----- */
  var scServer = select([['eu', 'smartcat.com'], ['us', 'us.smartcat.com'], ['ea', 'ea.smartcat.com'], ['custom', 'свой адрес']], 'eu');
  var scCustom = el('input', { type: 'text', placeholder: 'https://…' });
  var scAccount = el('input', { type: 'text', placeholder: 'Account ID' });
  var scKey = el('input', { type: 'password', placeholder: 'API-ключ' });
  var scProject = el('input', { type: 'text', placeholder: 'ссылка на проект или название; пусто = ' + SC_PROJECT_DEFAULT });
  var scEnAndroid = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.android });
  var scEnIos = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.ios });
  var scEnWeb = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.web });
  /* папка для архивов */
  var dirInfo = el('span', { class: 'muted' });
  var dirDated = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var dirUnzip = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  dirUnzip.checked = sget('wlx_dir_unzip') === '1';
  dirUnzip.addEventListener('change', function () { sset('wlx_dir_unzip', dirUnzip.checked ? '1' : '0'); });
  dirDated.checked = sget('wlx_dir_dated') !== '0';
  dirDated.addEventListener('change', function () { sset('wlx_dir_dated', dirDated.checked ? '1' : '0'); dirShow(); });
  function dirShow() {
    loadDir().then(function (h) {
      if (!h) { dirInfo.className = 'muted'; dirInfo.textContent = 'не выбрана — архивы скачиваются в «Загрузки»'; dirForget.classList.add('hide'); return; }
      dirForget.classList.remove('hide');
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) {
        dirInfo.className = p === 'granted' ? 'ok' : 'muted';
        dirInfo.textContent = 'архивы → «' + h.name + (dirDated.checked ? '/ДДММГГ' : '') + '»' + (p === 'granted' ? '' : ' (Chrome спросит разрешение при первом сохранении)');
      });
    });
  }
  var dirPick = el('button', { class: 'b g s', text: '📁 Выбрать папку…', onclick: function () {
    pickDir().then(function () { dirShow(); toast('✓ Папка для архивов: ' + dirHandle.name); }, function (e) { if (e && e.name !== 'AbortError') { dirInfo.className = 'red'; dirInfo.textContent = '✗ ' + (e.message || e); } });
  } });
  var dirForget = el('button', { class: 'b g s', text: 'Сбросить', onclick: function () { forgetDir().then(dirShow); } });
  /* отправка android + ios по расписанию */
  var schOn = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var schText = el('input', { type: 'text', placeholder: 'вт 14:00, пт 10:00' });
  var schNext = el('span', { class: 'muted' });
  var DOWS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function schParse(t) {
    return String(t || '').split(/[,;\n]+/).map(function (x) {
      var m = /(вс|пн|вт|ср|чт|пт|сб)\D*(\d{1,2})[:.](\d{2})/i.exec(x.trim());
      return m ? { dow: DOWS.indexOf(m[1].toLowerCase()), h: +m[2], m: +m[3] } : null;
    }).filter(Boolean);
  }
  function schShowNext() {
    var slots = schParse(schText.value || 'вт 14:00, пт 10:00');
    if (!slots.length) { schNext.className = 'red'; schNext.textContent = 'не поняла расписание — пиши так: вт 14:00, пт 10:00'; return; }
    var now = Date.now(), best = null;
    for (var d = 0; d < 8 && !best; d++) {
      var day = new Date(now + 3 * 3600e3 + d * 864e5);
      slots.forEach(function (s) {
        if (day.getUTCDay() !== s.dow) return;
        var t = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), s.h, s.m) - 3 * 3600e3;
        if (t > now && (!best || t < best)) best = t;
      });
    }
    var b = best ? new Date(best + 3 * 3600e3) : null;
    schNext.className = 'muted';
    schNext.textContent = !schOn.checked ? 'выключено' : b ? 'следующая: ' + DOWS[b.getUTCDay()] + ' ' + ('0' + b.getUTCDate()).slice(-2) + '.' + ('0' + (b.getUTCMonth() + 1)).slice(-2) +
      ' в ' + ('0' + b.getUTCHours()).slice(-2) + ':' + ('0' + b.getUTCMinutes()).slice(-2) + ' МСК' : '';
  }
  function schSave() { return scCall('sc-set-config', { config: { schedOn: schOn.checked, sched: schText.value.trim() || 'вт 14:00, пт 10:00' } }).then(schShowNext); }
  schOn.addEventListener('change', schSave);
  schText.addEventListener('change', schSave);
  var schRun = el('button', { class: 'b g s', text: 'Запустить сейчас', title: 'Сделать то же, что по расписанию: выгрузить android и ios и отправить в Smartcat (в фоновой вкладке)', onclick: function () {
    if (!confirm('Выгрузить android и ios и отправить в Smartcat прямо сейчас (как по расписанию)?')) return;
    scCall('sc-sched-run-now').then(function () { schNext.textContent = 'запущено — итог придёт уведомлением'; }, function (e) { schNext.textContent = '✗ ' + e.message; });
  } });
  /* кого назначать на английский — из «Моей команды» Smartcat */
  var asgOn = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var asgList = el('div', { class: 'team' });
  var asgMsg = el('span', { class: 'muted' });
  var asgSel = [];
  function asgSave() { return scCall('sc-set-config', { config: { enAssign: asgSel, enAssignOn: asgOn.checked } }).then(loadScConfig); }
  function asgRender(team) {
    asgList.textContent = '';
    var list = team || asgSel;
    if (!list.length) { asgList.appendChild(el('p', { class: 'muted', text: 'Никто не выбран — нажми «Загрузить команду из Smartcat».' })); return; }
    list.forEach(function (x) {
      var cb = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
      cb.checked = asgSel.some(function (y) { return y.id === x.id; });
      cb.addEventListener('change', function () {
        asgSel = asgSel.filter(function (y) { return y.id !== x.id; });
        if (cb.checked) asgSel.push({ id: x.id, name: x.name });
        asgSave().then(function () { asgMsg.textContent = 'Сохранено: ' + (asgSel.length ? asgSel.map(function (y) { return y.name; }).join(', ') : 'никто'); });
      });
      asgList.appendChild(el('label', { class: 'blk', style: 'margin-top:4px;color:#1d2330' }, [cb, x.name + (x.email ? ' · ' + x.email : '')]));
    });
  }
  asgOn.addEventListener('change', function () { asgSave(); });
  var asgLoad = el('button', { class: 'b g s', text: 'Загрузить команду из Smartcat', onclick: function () {
    asgMsg.textContent = 'Загружаю…'; asgLoad.disabled = true;
    scCall('sc-team').then(function (team) {
      asgMsg.textContent = 'В команде: ' + team.length + '. Отметь, кого назначать.';
      asgRender(team);
    }, function (e) { asgMsg.textContent = '✗ ' + e.message; }).then(function () { asgLoad.disabled = false; });
  } });
  var scLangs = el('textarea', { class: 'small', placeholder: 'если Smartcat не принимает код языка, например:\nuz_Latn=uz-Latn' });
  var scExtra = el('textarea', { class: 'small', placeholder: '{"workflowStages": ["translation"]}' });
  var scMsg = el('div', { class: 'muted' });
  var scCfg = null;
  function loadScConfig() {
    if (!HAS_EXT) return Promise.resolve(null);
    return scCall('sc-get-config').then(function (c) {
      if (!c.project) c.project = SC_PROJECT_DEFAULT;
      scCfg = c; return c;
    }, function () { return null; });
  }
  /* ----- сетапы: свой проект / английские проекты / коды языков; аккаунт и ключ общие ----- */
  var SETUP_FIELDS = ['project', 'enAndroid', 'enIos', 'enWeb', 'langMap', 'extra'];
  var scSetup = el('select', { class: 'presel' });
  function setupsOf(c) {
    var list = (c.setups || []).slice();
    if (!list.length) list.push({ name: 'Магазинка', project: c.project === SC_PROJECT_DEFAULT ? '' : c.project,
      enAndroid: c.enAndroid, enIos: c.enIos, enWeb: c.enWeb, langMap: c.langMap, extra: c.extra });
    return list;
  }
  function activeSetup(c) { var l = setupsOf(c); return l.filter(function (x) { return x.name === c.setup; })[0] || l[0]; }
  function fillSetupSelects(c) {
    var list = setupsOf(c), cur = activeSetup(c).name;
    [scSetup, scSetupQuick].forEach(function (sel) {
      sel.textContent = '';
      list.forEach(function (x) { sel.appendChild(el('option', { value: x.name, text: x.name })); });
      sel.value = cur;
    });
  }
  function fieldsNow() {
    return { project: scProject.value.trim(), enAndroid: scEnAndroid.value.trim(), enIos: scEnIos.value.trim(), enWeb: scEnWeb.value.trim(), langMap: scLangs.value, extra: scExtra.value.trim() };
  }
  /* переключить сетап: его поля становятся текущими настройками */
  function switchSetup(name) {
    return loadScConfig().then(function (c) {
      var list = setupsOf(c), x = list.filter(function (s) { return s.name === name; })[0];
      if (!x) return c;
      var cfg = { setups: list, setup: name };
      SETUP_FIELDS.forEach(function (f) { cfg[f] = x[f] || ''; });
      return scCall('sc-set-config', { config: cfg }).then(loadScConfig);
    }).then(function (c) { fillScSettings(); if (c) fillSetupSelects(c); return c; });
  }
  scSetup.addEventListener('change', function () { switchSetup(scSetup.value).then(function () { scMsg.textContent = 'Сетап «' + scSetup.value + '»'; }); });
  scSetupQuick.addEventListener('change', function () {
    var name = scSetupQuick.value;
    switchSetup(name).then(function (c) {
      scSetupNote.textContent = c ? 'проект: ' + (c.project || SC_PROJECT_DEFAULT) : '';
      if (!scImpBody.classList.contains('hide') && !scOpenPr) listScProjects(false);
    });
  });
  function newSetup() {
    loadScConfig().then(function (c) {
      var name = prompt('Название сетапа (например: Веб)');
      if (!name || !name.trim()) return;
      name = name.trim();
      var list = setupsOf(c).filter(function (x) { return x.name !== name; });
      list.push(Object.assign({ name: name }, fieldsNow(), { project: '' }));
      scProject.value = '';
      return scCall('sc-set-config', { config: { setups: list } }).then(function () { return switchSetup(name); }).then(function () {
        scMsg.textContent = 'Сетап «' + name + '» создан — впиши проект и нажми «Сохранить»';
        scProject.focus();
      });
    });
  }
  function deleteSetup() {
    loadScConfig().then(function (c) {
      var list = setupsOf(c), cur = activeSetup(c).name;
      if (list.length < 2) { scMsg.textContent = 'Это единственный сетап'; return; }
      if (!confirm('Удалить сетап «' + cur + '»?')) return;
      list = list.filter(function (x) { return x.name !== cur; });
      return scCall('sc-set-config', { config: { setups: list } }).then(function () { return switchSetup(list[0].name); });
    });
  }
  function fillScSettings() {
    loadScConfig().then(function (c) {
      if (!c) return;
      fillSetupSelects(c);
      scSetupNote.textContent = 'проект: ' + (c.project || SC_PROJECT_DEFAULT);
      scServer.value = c.server; scCustom.value = c.customUrl; scAccount.value = c.accountId;
      scCustomLbl.classList.toggle('hide', c.server !== 'custom');
      scKey.value = ''; scKey.placeholder = c.hasKey ? 'ключ сохранён — впиши новый, чтобы заменить' : 'API-ключ';
      scLangs.value = c.langMap; scExtra.value = c.extra; scProject.value = c.project === SC_PROJECT_DEFAULT ? '' : c.project;
      scEnAndroid.value = c.enAndroid; scEnIos.value = c.enIos; scEnWeb.value = c.enWeb || '';
      asgSel = (c.enAssign || []).slice(); asgOn.checked = c.enAssignOn !== false;
      schOn.checked = !!c.schedOn; schText.value = c.sched || 'вт 14:00, пт 10:00'; schShowNext();
      dirShow();
      if (!asgList.querySelector('input')) asgRender(null);
    });
  }
  function saveScSettings() {
    if (scExtra.value.trim()) { try { JSON.parse(scExtra.value); } catch (e) { return Promise.reject(new Error('«Доп. параметры» — не JSON')); } }
    return loadScConfig().then(function (c) {
      var list = c ? setupsOf(c) : [], cur = c ? activeSetup(c).name : 'Магазинка', now = fieldsNow();
      list = list.map(function (x) { return x.name === cur ? Object.assign({ name: cur }, now) : x; });
      if (!list.length) list.push(Object.assign({ name: cur }, now));
      return scCall('sc-set-config', { config: Object.assign({ server: scServer.value, customUrl: scCustom.value.trim(), accountId: scAccount.value.trim(),
        apiKey: scKey.value.trim(), setups: list, setup: cur }, now) });
    }).then(loadScConfig);
  }
  /* копия настроек в файл (без API-ключа) — для нового компьютера или коллеги */
  var BACKUP_KEYS = ['wlx_links', 'wlx_langs', 'wlx_layout', 'wlx_en', 'wlx_pj', 'wlx_mt_links', 'wlx_sc_split', 'wlx_m', 'wlx_f', 'wlx_c', 'wlx_presets_exp', 'wlx_presets_sc',
    'wlx_scdone', 'wlx_scimp_hide', 'wlx_scimp_mode', 'wlx_varskip', 'wlx_dir_dated', 'wlx_dir_unzip', 'wlx_byplat', 'wlx_noen'];
  var restoreInput = el('input', { type: 'file', accept: '.json', class: 'hide' });
  function backupSettings() {
    loadScConfig().then(function (c) {
      var local = {};
      BACKUP_KEYS.forEach(function (k) { var v = sget(k); if (v !== null) local[k] = v; });
      var data = { weblateExtensionSettings: 1, saved: new Date().toISOString(), smartcat: c ? {
        server: c.server, customUrl: c.customUrl, accountId: c.accountId, langMap: c.langMap, extra: c.extra,
        project: c.project === SC_PROJECT_DEFAULT ? '' : c.project, enAndroid: c.enAndroid, enIos: c.enIos, enWeb: c.enWeb || '',
        setups: c.setups || [], setup: c.setup || '', enWebKeep: 1, enAssign: c.enAssign || [], enAssignOn: c.enAssignOn !== false } : null, local: local };
      saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'weblate-extension-settings.json');
      scMsg.textContent = 'Сохранено в файл (без API-ключа)';
    });
  }
  restoreInput.addEventListener('change', function () {
    var f = restoreInput.files[0]; restoreInput.value = '';
    if (!f) return;
    f.text().then(function (t) {
      var d = JSON.parse(t);
      if (!d.weblateExtensionSettings) throw new Error('это не файл настроек расширения');
      Object.keys(d.local || {}).forEach(function (k) { if (BACKUP_KEYS.indexOf(k) >= 0) sset(k, d.local[k]); });
      return d.smartcat ? scCall('sc-set-config', { config: Object.assign({}, d.smartcat, { apiKey: '' }) }) : null;
    }).then(function () {
      fillScSettings(); scLinks.value = sget('wlx_mt_links') || SC_DEFAULT_LINKS;
      scMsg.textContent = '✓ Настройки загружены из файла. API-ключ — впиши, если его здесь ещё нет.';
    }, function (e) { scMsg.textContent = '✗ ' + (e.message || e); });
  });
  var scCustomLbl = el('label', {}, ['Адрес сервера', scCustom]);
  scServer.addEventListener('change', function () { scCustomLbl.classList.toggle('hide', scServer.value !== 'custom'); });
  var settingsPane = el('div', { class: 'settings hide' }, [
    el('button', { class: 'b g s back2', text: '← Назад', onclick: function () { showSettings(false); } }),
    el('h3', { text: 'Подключение к Smartcat' }),
    el('p', { class: 'muted', text: 'Ключ API: Smartcat → Настройки → API. Хранится только в расширении на этом компьютере.' }),
    el('label', {}, ['Сервер', scServer]),
    scCustomLbl,
    el('label', {}, ['Account ID', scAccount]),
    el('label', {}, ['API-ключ', scKey]),
    el('h3', { text: 'Сетап' }),
    el('p', { class: 'muted', text: 'Свой проект и английские проекты под задачу (например «Магазинка» и «Веб»). Аккаунт и ключ общие.' }),
    el('div', { class: 'row' }, [scSetup,
      el('button', { class: 'b g s', text: '＋ Новый сетап', onclick: newSetup }),
      el('button', { class: 'b g s', text: 'Удалить сетап', onclick: deleteSetup })]),
    el('label', {}, ['Проект в Smartcat (ссылка или название; пусто — «' + SC_PROJECT_DEFAULT + '»)', scProject]),
    el('label', {}, ['Английский дополнительно в проект (android) — пусто = стандартный', scEnAndroid]),
    el('label', {}, ['Английский дополнительно в проект (ios) — пусто = стандартный', scEnIos]),
    el('label', {}, ['Веб: английский → проект (остальные языки веба в Smartcat не уходят), папка «ДДММГГ web» — пусто = «' + SC_EN_DEFAULTS.web + '»', scEnWeb]),
    el('h3', { text: 'Папка для архивов' }),
    el('p', { class: 'muted', text: 'Куда сохранять zip для подрядчиков (например, «Подрядчики» на рабочем столе). Выбирается один раз; Chrome может иногда переспросить разрешение. Если папка недоступна — архив скачается в «Загрузки».' }),
    el('div', { class: 'row' }, [dirPick, dirForget, dirInfo]),
    el('label', { class: 'blk', style: 'color:#1d2330' }, [dirUnzip, 'выгрузку непереведённого сохранять папками, без zip (иначе — отдельный zip на платформу: ДДММГГ_web.zip / ДДММГГ_iOS.zip / ДДММГГ_android.zip)']),
    el('label', { class: 'blk', style: 'color:#1d2330' }, [dirDated, 'zip-архивы класть в подпапку с датой (ДДММГГ)']),
    el('h3', { text: 'Отправка android и ios по расписанию' }),
    el('p', { class: 'muted', text: 'В это время (по Москве) расширение само делает «🚀 Выгрузить и отправить в Smartcat» для android и ios и присылает уведомление с итогом. Нужно, чтобы компьютер и Chrome были включены и ты была залогинена в Weblate. Пропущено — придёт уведомление с кнопкой «Отправить сейчас». Если сегодня уже отправляли — второй раз не шлёт. Включай только на одном компьютере.' }),
    el('label', { class: 'blk', style: 'color:#1d2330' }, [schOn, 'отправлять по расписанию']),
    el('label', {}, ['Когда (по Москве)', schText]),
    el('div', { class: 'row' }, [schRun, schNext]),
    el('h3', { text: 'Назначать на английский' }),
    el('p', { class: 'muted', text: 'Кого из «Моей команды» Smartcat сразу назначать на английские документы при отправке: EN android, EN ios и веб («МП Web»). Режим — все, кто принял. Машинный перевод (AI translation) не трогается.' }),
    el('label', { class: 'blk', style: 'color:#1d2330' }, [asgOn, 'назначать автоматически при отправке']),
    el('div', { class: 'row' }, [asgLoad, asgMsg]),
    asgList,
    el('details', {}, [el('summary', { text: 'Дополнительно' }),
      el('label', {}, ['Коды языков для Smartcat (код_weblate=код_smartcat, по строке)', scLangs]),
      el('label', {}, ['Доп. параметры создания проекта (JSON, добавляются к стандартным)', scExtra])]),
    el('div', { class: 'row' }, [
      el('button', { class: 'b s', text: 'Сохранить', onclick: function () {
        scMsg.textContent = 'Сохраняю…';
        saveScSettings().then(function () { scMsg.textContent = 'Сохранено'; fillScSettings(); }, function (e) { scMsg.textContent = '✗ ' + e.message; });
      } }),
      el('button', { class: 'b g s', text: 'Проверить подключение', onclick: function () {
        scMsg.textContent = 'Проверяю…';
        saveScSettings().then(function () { return scCall('sc-check'); }).then(function (a) {
          scMsg.textContent = '✓ Подключено к Smartcat' + (a.name ? ': ' + a.name : '');
          fillScSettings();
          return scCall('sc-resolve-project', { ref: scProject.value.trim() || SC_PROJECT_DEFAULT }).then(function (pr) {
            scMsg.textContent += ' · проект «' + pr.name + '» найден' +
              (pr.targetLanguages.length ? ', коды языков в нём: ' + pr.targetLanguages.join(', ') : '');
          });
        }, function (e) { scMsg.textContent = '✗ ' + e.message; });
      } }),
      scMsg
    ]),
    el('details', {}, [el('summary', { text: 'Перенос на другой компьютер' }),
      el('div', { class: 'row' }, [
        el('button', { class: 'b g s', text: 'Сохранить настройки в файл', onclick: backupSettings }),
        el('button', { class: 'b g s', text: 'Загрузить настройки из файла', onclick: function () { restoreInput.click(); } }),
        restoreInput
      ]),
      el('p', { class: 'muted', text: 'Файл без API-ключа. Настройки хранятся в расширении и не сбрасываются при обновлении.' })])
  ]);
  var mainArea;
  function showSettings(on) {
    settingsPane.classList.toggle('hide', !on);
    if (mainArea) mainArea.classList.toggle('hide', on);
    if (on) fillScSettings();
  }

  var back = el('div', { class: 'back', onclick: function (e) { if (e.target === back) hide(); } }, [
    el('div', { class: 'box' }, [
      el('div', { class: 'top' }, [
        el('h1', { text: 'Weblate: выгрузка и загрузка переводов' }),
        el('div', {}, [
          HAS_EXT ? el('button', { class: 'x', title: 'Настройки Smartcat', text: '⚙', onclick: function () { showSettings(settingsPane.classList.contains('hide')); } }) : null,
          el('button', { class: 'x', title: 'Закрыть', text: '×', onclick: hide })
        ])
      ]),
      toastEl = el('div', { class: 'toast hide' }),
      settingsPane,
      mainArea = el('div', {}, [
        el('div', { class: 'tabs' }, HAS_EXT ? [tabExp, tabSc, tabImp] : [tabExp, tabImp]),
        exportPane,
        scPane,
        importPane
      ])
    ])
  ]);
  root.appendChild(back);

  function show() { host.style.display = ''; }
  function hide() { host.style.display = 'none'; }
  function setAll(v) { langsBox.querySelectorAll('input').forEach(function (i) { i.checked = v; }); }
  function friendly(e) {
    var m = String(e && e.message || e);
    if (/HTTP 40[13]/.test(m)) return 'Weblate не пускает. Проверь, что ты вошла в Weblate в этой вкладке, и нажми закладку ещё раз.\n\n' + m;
    if (/HTTP 404/.test(m)) return 'Не нашёлся компонент или язык — проверь ссылку.\n\n' + m;
    if (/Failed to fetch|NetworkError/.test(m)) return 'Нет связи с Weblate (VPN?).\n\n' + m;
    return m;
  }

  /* поле ссылок при открытии пустое; прошлые ссылки можно вернуть кнопкой */
  var saved = sget('wlx_links');
  if (!saved) restoreBtn.classList.add('hide');

  var comps = [];
  function loadLangs() {
    err1.textContent = ''; compList.textContent = '';
    sset('wlx_links', links.value);
    if (!parseLinks(links.value).length) { err1.textContent = 'Не нашла ни одной ссылки вида …/projects/<проект>/…'; return; }
    loadBtn.disabled = true; info.textContent = 'Разбираю ссылки…';
    resolveLinks(links.value).then(function (r) {
      comps = r.comps;
      if (r.missing.length) err1.textContent = 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n');
      if (!comps.length) throw new Error('Не нашла ни одного компонента');
      sset('wlx_comps', JSON.stringify(comps));
      info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки…';
      var all = [], done = 0;
      return pool(comps, 6, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          all.push(trs); done++;
          info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки… ' + done + ' из ' + comps.length;
        });
      }).then(function () { return all; });
    }).then(function (all) {
      var langs = {};
      all.forEach(function (trs) {
        trs.forEach(function (t) { if (!t.is_source) langs[t.language.code] = t.language.name; });
      });
      var prev = null;
      try { prev = JSON.parse(sget('wlx_langs') || 'null'); } catch (e) {}
      langsBox.textContent = '';
      Object.keys(langs).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (code) {
        var cb = el('input', { type: 'checkbox', value: code });
        cb.checked = prev ? prev.indexOf(code) >= 0 : !/generated/i.test(langs[code]);
        langsBox.appendChild(el('label', { title: code }, [cb, langLabel(code)]));
      });
      info.textContent = 'Компонентов: ' + comps.length + (comps.length > 100 ? ' — много, выгрузка займёт время' : '');
      var ul = el('div', { class: 'complist' });
      comps.forEach(function (x) { ul.appendChild(el('div', { text: x.p + ' / ' + x.c })); });
      compList.appendChild(el('details', {}, [el('summary', { text: 'Какие компоненты нашлись (' + comps.length + ')' }), ul]));
      langSec.classList.remove('hide');
    }).catch(function (e) {
      err1.textContent = (err1.textContent ? err1.textContent + '\n\n' : '') + friendly(e); info.textContent = '';
    }).then(function () { loadBtn.disabled = false; });
  }

  function pool(items, size, fn) {
    var i = 0;
    function worker() { if (i >= items.length) return Promise.resolve(); var it = items[i++]; return fn(it).then(worker); }
    var ws = [];
    for (var k = 0; k < Math.min(size, items.length); k++) ws.push(worker());
    return Promise.all(ws);
  }

  /* выгрузка: компоненты × языки → { res, errs } */
  function exportCore(comps, langs, opts, onTick) {
    var res = [], errs = [];
    return pool(comps, 4, function (x) {
      return translations(x.p, x.c).then(function (trs) {
        return langs.reduce(function (chain, wanted) {
          return chain.then(function () {
            var code = matchLanguage(wanted, trs);
            if (!code) { errs.push([x.c, wanted, 'языка нет в компоненте']); onTick(); return; }
            var src = trs.filter(function (t) { return t.is_source; })[0];
            var srcCode = src ? src.language.code : 'ru';
            return downloadPo(x.p, x.c, code, opts.q).then(function (raw) {
              var r = filterPo(raw, false);
              if (!r.plurals || !opts.wantJson) return r;
              return Promise.all([units(x.p, x.c, code, opts.q + ' AND has:plural'), componentFormat(x.p, x.c)]).then(function (a) {
                var j = pluralJson(a[0], a[1], srcCode, code);
                if (!j.strings) return r;
                res.push({ component: x.c, p: x.p, language: code, src: srcCode, strings: j.strings, words: j.words, text: j.text, ext: 'json' });
                return filterPo(raw, true);
              }, function (e) {
                errs.push([x.c, code, 'плюралки не удалось выгрузить в .json, оставила их в .po: ' + friendly(e).split('\n')[0]]);
                return r;
              });
            }).then(function (r) {
              if (r.strings) res.push({ component: x.c, p: x.p, language: code, src: srcCode, strings: r.strings, words: r.words, text: r.text, ext: 'po' });
            }).catch(function (e) { errs.push([x.c, code, friendly(e)]); }).then(onTick);
          });
        }, Promise.resolve());
      }).catch(function (e) {
        errs.push([x.c, '*', friendly(e)]);
        langs.forEach(onTick);
      });
    }).then(function () { return { res: res, errs: errs }; });
  }

  function runExport() {
    err2.textContent = '';
    var langs = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    if (!langs.length) { err2.textContent = 'Отметь хотя бы один язык'; return; }
    sset('wlx_langs', JSON.stringify(langs));
    var total = comps.length * langs.length, done = 0;
    function tick() { done++; barFill.style.width = Math.round(100 * done / total) + '%'; progText.textContent = 'Скачиваю… ' + done + ' из ' + total; }
    goBtn.disabled = true; resSec.classList.remove('hide'); results.textContent = '';
    barFill.style.width = '0%'; progText.textContent = 'Скачиваю… 0 из ' + total;
    exportCore(comps, langs, { q: fuzzy.checked ? QUERY_ALL : QUERY_EMPTY, wantJson: pluralsJson.checked }, tick).then(function (r) {
      goBtn.disabled = false;
      progText.textContent = 'Готово!';
      barFill.style.width = '100%';
      showResults(r.res, r.errs);
    });
  }


  function today() { return new Date().toISOString().slice(0, 10); }
  var ENGLISH_DIR = 'Английский ШТАТ';
  function isEnglish(code) { return baseLang(code) === 'en'; }
  var PLURAL_MARK = '_plural form';
  /* .po — как при ручном скачивании из Weblate: global_site-wb-ios_new-az_Latn.po */
  function poName(r) { return r.ext === 'json' ? fileKey(r.component) + '_' + r.language + PLURAL_MARK + '.json' : scFileName(r); }
  function archivePath(r, layout, englishApart) {
    var folder = englishApart && isEnglish(r.language) ? ENGLISH_DIR
      : layout === 'language' ? langName(r.language)
      : layout === 'flat' ? ''
      : fileKey(r.component);
    return (folder ? folder + '/' : '') + poName(r);
  }
  function showResults(res, errs) {
    res.sort(function (a, b) { return (a.language + a.component).localeCompare(b.language + b.component); });
    results.textContent = '';
    if (!res.length) results.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' }));
    else {
      var by = {};
      res.forEach(function (r) {
        var a = by[r.language] = by[r.language] || { files: 0, strings: 0, words: 0 };
        a.files++; a.strings += r.strings; a.words += r.words;
      });
      var t = el('table', {}, [el('tr', {}, [
        el('th', { text: 'Язык' }), el('th', { class: 'n', text: 'Файлов' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' }), el('th')
      ])]);
      Object.keys(by).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (lang) {
        var a = by[lang];
        t.appendChild(el('tr', {}, [
          el('td', { title: lang }, [langLabel(lang)]), el('td', { class: 'n', text: String(a.files) }),
          el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) }),
          el('td', { class: 'n' }, [el('button', { class: 'b g s', text: 'Скачать .zip', onclick: function () {
            saveBlob(makeZip(res.filter(function (r) { return r.language === lang; })
              .map(function (r) { return { name: poName(r), text: r.text }; })), 'weblate_' + lang + '_' + today() + '.zip');
          } })])
        ]));
      });
      var layoutHint = el('span', { class: 'muted' });
      function updateHint() {
        var l = currentLayout();
        layoutHint.textContent = (byPlatform.checked ? (unzipToDir() ? 'папки ' : 'отдельный zip на платформу: ') + ddmmyy() + '_web / _iOS / _android, внутри ' : '') +
          (l === 'language' ? 'папки по языкам' : l === 'flat' ? 'все файлы в одной папке' : 'папки по компонентам') +
          (skipEnglish.checked ? ', без английского (он — в Smartcat)' : englishApart.checked ? ', английский — в «' + ENGLISH_DIR + '»' : '') + ' + summary.csv' +
          (unzipToDir() ? ' → сразу папками в «' + dirHandle.name + '»' : '') + ' (раскладку можно поменять выше)';
      }
      updateHint();
      layoutBox.addEventListener('change', updateHint);
      englishApart.addEventListener('change', updateHint);
      byPlatform.addEventListener('change', updateHint);
      skipEnglish.addEventListener('change', updateHint);
      results.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать всё одним архивом', onclick: function () {
          var layout = currentLayout(), eng = englishApart.checked, byPlat = byPlatform.checked;
          var files = res.filter(function (r) { return !(skipEnglish.checked && isEnglish(r.language)); }).map(function (r) { return { name: (byPlat ? platDir(r.p, r.component) + '/' : '') + archivePath(r, layout, eng), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
          var csv = '﻿компонент;язык;код;формат;строк;слов\n' + res.map(function (r) {
            return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
          }).join('\n') + '\n';
          if (!byPlat) files.push({ name: 'summary.csv', text: csv });
          else {
            /* summary — свой в каждой папке платформы */
            var plats = {};
            res.filter(function (r) { return !(skipEnglish.checked && isEnglish(r.language)); }).forEach(function (r) { (plats[platDir(r.p, r.component)] = plats[platDir(r.p, r.component)] || []).push(r); });
            Object.keys(plats).forEach(function (d) {
              files.push({ name: d + '/summary.csv', text: '\ufeffкомпонент;язык;код;формат;строк;слов\n' + plats[d].map(function (r) {
                return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
              }).join('\n') + '\n' });
            });
          }
          saveFiles(files, 'weblate_all_' + today() + '.zip');
        } }),
        layoutHint
      ]));
      results.appendChild(el('p', { class: 'muted', text: 'Или отдельный архив на язык:' }));
      results.appendChild(t);
      var dt = el('table', {}, [el('tr', {}, [el('th', { text: 'Компонент' }), el('th', { text: 'Язык' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' })])]);
      res.forEach(function (r) {
        dt.appendChild(el('tr', {}, [el('td', { text: r.component + (r.ext === 'json' ? ' · плюралки .json' : '') }), el('td', { title: r.language }, [langLabel(r.language)]),
          el('td', { class: 'n', text: String(r.strings) }), el('td', { class: 'n', text: String(r.words) })]));
      });
      results.appendChild(el('details', {}, [el('summary', { text: 'По компонентам' }), dt]));
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      results.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
    if (HAS_EXT) renderSmartcat(res);
  }

  /* ----- шаг «Отправить в Smartcat» после выгрузки ----- */
  function scProjects() { try { return JSON.parse(sget('wlx_sc_projects') || '[]'); } catch (e) { return []; } }
  function saveScProjects(list) {
    list = list.slice(0, 40);
    sset('wlx_sc_projects', JSON.stringify(list));
    if (HAS_EXT) scCall('sc-list-set', { list: list }).catch(function () {});
  }
  /* при открытии: объединить список со страницы и копию из расширения */
  function syncScProjects() {
    if (!HAS_EXT) return Promise.resolve();
    return scCall('sc-list-get').then(function (ext) {
      var local = scProjects(), keys = {};
      local.forEach(function (x) { keys[x.key || x.id] = 1; });
      (ext || []).forEach(function (e) {
        local.forEach(function (x) { if ((x.key || x.id) === (e.key || e.id) && e.uploaded && !x.uploaded) x.uploaded = e.uploaded; });
      });
      var merged = local.concat((ext || []).filter(function (x) { return !keys[x.key || x.id]; }));
      merged.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
      saveScProjects(merged);
    }, function () {});
  }
  function renderSmartcat(res, container) {
    var po = res.filter(function (r) { return r.ext !== 'json'; });
    var js = res.filter(function (r) { return r.ext === 'json' && r.strings; });
    if (!po.length && !js.length) return;
    var box = el('div', { class: 'track' }, [el('h2', { text: '4. Отправить в Smartcat' })]);
    (container || results).appendChild(box);
    return loadScConfig().then(function (c) {
      if (!c || !c.accountId || !c.hasKey) {
        box.appendChild(el('p', { class: 'muted', text: 'Можно отправить эти строки в Smartcat одной кнопкой — подключи Smartcat в ⚙ вверху окна.' }));
        return;
      }
      var map = scLangMap(c.langMap);
      /* отдельный файл на каждый компонент × язык — со своими непереведёнными строками,
         имя как при скачивании из Weblate: global_site-wb-android-hy.po */
      var langs = [];
      /* az_N11 и подобные варианты в Smartcat не отправляем — машперевод только в обычный язык (az) */
      po = po.filter(function (r) { return !/_n\d+$/i.test(r.language); });
      js = js.filter(function (r) { return !/_n\d+$/i.test(r.language); });
      var files = po.map(function (r) {
        if (langs.indexOf(r.language) < 0) langs.push(r.language);
        var key = r.p + '-' + fileKey(r.component) + '-' + r.language;
        return { name: key + '.po', key: key, p: r.p, c: r.component, lang: r.language, text: r.text, strings: r.strings, src: r.src };
      }).filter(function (f) { return f.strings; });
      /* плюралки (.json) — тоже в Smartcat: «<компонент>_<язык>_plural form.json» */
      js.forEach(function (r) {
        if (langs.indexOf(r.language) < 0) langs.push(r.language);
        var name = poName(r);
        files.push({ name: name, key: name.replace(/\.json$/i, ''), p: r.p, c: r.component, lang: r.language, text: r.text, strings: r.strings, src: r.src, json: true });
      });
      var jsonCount = 0;
      /* веб: в Smartcat уходит только английский — в свой проект («МП Web»), в папку «ДДММГГ web»; остальные языки веба — только в архиве */
      var webAll = files.filter(function (f) { return scPlatform(f.p, f.c) === 'web'; });
      var webEn = webAll.filter(function (f) { return isEnglish(f.lang); });
      var webSkip = webAll.filter(function (f) { return !isEnglish(f.lang); });
      files = files.filter(function (f) { return scPlatform(f.p, f.c) !== 'web'; });
      var webRef = c.enWeb || SC_EN_DEFAULTS.web;
      var webGroup = webEn.length ? { files: webEn, input: el('input', { type: 'text', value: ddmmyy() + ' web' }), note: el('span', { class: 'muted' }) } : null;
      /* проекты по платформе: 290926_android, 290926_ios (дата отправки в начале) */
      function platform(f) { return scPlatform(f.p, f.c); }
      var split = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 4px 0 0;vertical-align:middle' }); split.checked = sget('wlx_sc_split') !== '0';
      var targetName = '';
      var groupsBox = el('div');
      var groups = [];
      function buildGroups() {
        sset('wlx_sc_split', split.checked ? '1' : '0');
        var by = {};
        files.forEach(function (f) { var g = split.checked ? platform(f) : 'all'; (by[g] = by[g] || []).push(f); });
        groups = Object.keys(by).sort().map(function (g) {
          var one = by[g].every(function (f) { return f.c === by[g][0].c; });
          var name = ddmmyy() + (g === 'all' ? '_' + (one ? fileKey(by[g][0].c) : 'weblate') : '_' + g);
          return { files: by[g], input: el('input', { type: 'text', value: name }), note: el('span', { class: 'muted' }) };
        });
        groupsBox.textContent = '';
        groups.forEach(function (g) {
          var strings = g.files.reduce(function (a, f) { return a + f.strings; }, 0);
          var comps = g.files.map(function (f) { return f.c; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
          groupsBox.appendChild(el('div', { class: 'scgroup' }, [
            el('label', { class: 'muted blk' }, [c.project ? 'Папка в проекте «' + (targetName || c.project) + '»' : 'Проект в Smartcat', g.input]),
            el('div', { class: 'muted', text: g.files.length + ' файл(ов) — ' + comps.length + ' компонент(ов) × языки, ' + strings + ' строк: ' + comps.join(', ') }),
            g.note
          ]));
          checkName(g);
          g.input.addEventListener('change', function () { checkName(g); });
        });
      }
      function checkName(g) {
        g.note.className = 'muted'; g.note.textContent = '';
        if (c.project) return;
        scCall('sc-find', { name: g.input.value.trim() }).then(function (list) {
          if (list && list.length) { g.note.className = 'red'; g.note.textContent = 'В Smartcat уже есть проект «' + g.input.value.trim() + '» — будет создан ещё один с тем же именем. Можно поменять название.'; }
        }, function () {});
      }
      if (c.project && files.length) scCall('sc-resolve-project', { ref: c.project }).then(function (pr) {
        targetName = pr.name;
        var pl = projectLangs(pr);
        var warn = el('p', { class: 'red', text: 'В проекте «' + pr.name + '» нет: ' + pl.missing.map(langName).join(', ') +
          ' — эти языки не отправлю (в проекте: ' + pl.all.join(', ') + ').' });
        if (pl.missing.length) { if (groupsBox.parentNode === box) box.insertBefore(warn, groupsBox); else box.appendChild(warn); }
        groupsBox.querySelectorAll('label').forEach(function (l) { if (l.firstChild && l.firstChild.nodeType === 3) l.firstChild.textContent = 'Папка в проекте «' + pr.name + '»'; });
      }, function (e) { msg.className = 'red'; msg.textContent = '✗ Проект в Smartcat: ' + e.message; });
      if (files.length) {
        box.appendChild(el('label', { class: 'muted blk' }, [split, c.project ? ' отдельная папка для android и ios' : ' отдельный проект для android и ios']));
        box.appendChild(groupsBox);
        split.addEventListener('change', buildGroups);
        buildGroups();
      }
      if (webGroup) {
        var webLbl = el('label', { class: 'muted blk' }, ['Веб, английский → папка в проекте «' + webRef + '»', webGroup.input]);
        box.appendChild(el('div', { class: 'scgroup' }, [webLbl,
          el('div', { class: 'muted', text: webEn.length + ' файл(ов): ' + webEn.map(function (f) { return f.c; }).join(', ') }), webGroup.note]));
        scCall('sc-resolve-project', { ref: webRef }).then(function (pr) { webLbl.firstChild.textContent = 'Веб, английский → папка в проекте «' + pr.name + '»'; },
          function (e) { webGroup.note.className = 'red'; webGroup.note.textContent = '✗ Проект «' + webRef + '»: ' + e.message + ' (поправь в ⚙ → «Веб: английский → проект»)'; });
      }
      if (webSkip.length) box.appendChild(el('p', { class: 'muted', text: 'Веб: ' + webSkip.map(function (f) { return langName(f.lang); })
        .filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + ' — только в архиве, в Smartcat для веба уходит только английский.' }));
      if (!files.length && !webGroup) { box.appendChild(el('p', { class: 'muted', text: 'Отправлять в Smartcat нечего.' })); return; }
      box.appendChild(el('p', { class: 'muted', text: 'Языки: ' + langs.map(function (l) { return langName(l) + ' → ' + map(l); }).join(', ') + '.' +
        '' }));
      if (jsonCount) {
        var jsByLang = {};
        res.filter(function (r) { return r.ext === 'json'; }).forEach(function (r) { (jsByLang[r.language] = jsByLang[r.language] || []).push(r.component); });
        box.appendChild(el('p', { class: 'muted', text: 'Плюралки (.json) в Smartcat не отправляются — они только в архиве: ' +
          Object.keys(jsByLang).sort().map(function (l) { return langName(l) + ' — ' + jsByLang[l].length + ' (' + jsByLang[l].join(', ') + ')'; }).join('; ') + '.' }));
      }
      var msg = el('div', { class: 'muted' });
      /* английский — ещё и в отдельные проекты по платформе, без папки */
      var enTargets = { android: c.enAndroid || SC_EN_DEFAULTS.android, ios: c.enIos || SC_EN_DEFAULTS.ios };
      var enFiles = files.filter(function (f) { return isEnglish(f.lang) && enTargets[scPlatform(f.p, f.c)]; });
      if (enFiles.length) box.appendChild(el('p', { class: 'muted', text: 'Английский (' + enFiles.length + ' файл.) также уйдёт без папки в проекты для английского (' +
        enFiles.map(function (f) { return scPlatform(f.p, f.c); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') +
        ') с именем ' + ddmmyy() + '_' + enFiles[0].name + ' — обратно оттуда не забираю.' }));
      function sendEnglish() {
        var by = {};
        enFiles.forEach(function (f) { var pl = scPlatform(f.p, f.c); (by[pl] = by[pl] || []).push(f); });
        return Object.keys(by).reduce(function (chain, pl) {
          return chain.then(function (acc) {
            return scCall('sc-resolve-project', { ref: enTargets[pl] }).then(function (pr) {
              var pls = (pr.targetLanguages || []).map(String);
              var code = pls.filter(function (x) { return x.toLowerCase() === map('en').toLowerCase(); })[0] ||
                pls.filter(function (x) { return baseLang(x) === 'en'; })[0] || (pls.length ? null : map('en'));
              if (!code) throw new Error('в проекте «' + pr.name + '» нет английского (в нём: ' + pls.join(', ') + ')');
              return scCall('sc-add-docs', { projectId: pr.id, files: by[pl].map(function (f) {
                return { name: ddmmyy() + '_' + f.name, text: scSendText(f.text), targetLanguages: [code] };
              }) }).then(function (r) { acc.push({ ok: true, text: pl + ' → ' + pr.name + ' (' + r.documents.length + ' док.)', docIds: r.documents.map(function (d) { return d.id; }) }); return acc; });
            }).catch(function (e) { acc.push({ ok: false, text: pl + ': ' + e.message }); return acc; });
          });
        }, Promise.resolve([]));
      }
      function createOne(g, extra) {
        var model = Object.assign({
          name: g.input.value.trim() || ddmmyy() + '_weblate',
          description: 'Создано расширением Weblate. Компоненты: ' + g.files.map(function (f) { return f.p + '/' + f.c; })
            .filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', '),
          sourceLanguage: map(g.files[0].src || 'ru'),
          targetLanguages: langs.map(map),
          assignToVendor: false, useMT: true, pretranslate: true, useTranslationMemory: true,
          autoPropagateRepetitions: false, isForTesting: false, workflowStages: ['translation']
        }, extra);
        return scCall('sc-create', { model: model, files: [] }).then(function (proj) {
          return addToProject(g, { id: proj.id, name: proj.name || model.name, targetLanguages: proj.targetLanguages || model.targetLanguages }, '');
        });
      }
      /* добавить в существующий проект: папка = название группы */
      /* языки выгрузки → языки проекта: точное совпадение, иначе по основному языку (en ↔ en-US); остальных в проекте нет */
      function projectLangs(pr) {
        var pl = (pr.targetLanguages || []).map(String), out = {}, missing = [];
        langs.forEach(function (l) {
          var want = map(l), hit = pl.filter(function (x) { return x.toLowerCase() === want.toLowerCase(); })[0] ||
            pl.filter(function (x) { return baseLang(x) === baseLang(want); })[0];
          if (hit || !pl.length) out[l] = hit || want; else missing.push(l);
        });
        return { codes: out, missing: missing, all: pl };
      }
      function addToProject(g, pr, folderOverride) {
        var folder = folderOverride != null ? folderOverride : (g.input.value.trim() || ddmmyy() + '_weblate');
        var pl = projectLangs(pr);
        var send = g.files.filter(function (f) { return pl.codes[f.lang]; });
        if (!send.length) return Promise.reject(new Error('ни одного выбранного языка нет в проекте «' + pr.name + '» (в нём: ' + pl.all.join(', ') + ')'));
        return scCall('sc-add-docs', { projectId: pr.id,
          files: send.map(function (f) { return { name: (folder ? folder + '/' : '') + f.name, text: scSendText(f.text), targetLanguages: [pl.codes[f.lang]] }; }) }).catch(function (e) {
          if (/target languages/i.test(String(e.message))) throw new Error(e.message + ' — отправляла языки: ' +
            send.map(function (f) { return pl.codes[f.lang]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') +
            ', в проекте «' + pr.name + '»: ' + (pl.all.length ? pl.all.join(', ') : 'Smartcat не отдал список языков'));
          throw e;
        }).then(function (r) {
          if (!r.documents.length) throw new Error('Smartcat не показал новых документов в проекте — проверь проект вручную');
          var lmap = {}, byKey = {}, docs = {}, lost = [];
          send.forEach(function (f) { byKey[f.key] = f; lmap[pl.codes[f.lang].toLowerCase()] = f.lang; });
          r.documents.forEach(function (d) {
            var f = byKey[scDocKey(d.name)] || byKey[scDocKey(d.fullPath)];
            if (f) docs[d.id] = { p: f.p, c: f.c, lang: f.lang, json: !!f.json }; else lost.push(d.name + ' (' + d.targetLanguage + ')');
          });
          if (pl.missing.length) lost.unshift('языков нет в проекте, не отправлены: ' + pl.missing.map(langName).join(', '));
          var key = pr.id + '#' + (folder || 'root');
          var list = scProjects().filter(function (x) { return (x.key || x.id) !== key; });
          list.unshift({ key: key, id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), created: new Date().toISOString(), docs: docs, files: {}, langs: lmap });
          saveScProjects(list);
          return { id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), docs: Object.keys(docs).length, lost: lost, docIds: Object.keys(docs) };
        });
      }
      var btn = el('button', { class: 'b', text: 'Отправить в Smartcat', onclick: function () {
        var extra = {};
        try { extra = c.extra ? JSON.parse(c.extra) : {}; } catch (e) {}
        btn.disabled = true; split.disabled = true; msg.className = 'muted';
        msg.textContent = c.project ? 'Добавляю файлы в проект…' : 'Создаю проекты в Smartcat…';
        var made = [], chain = c.project ? scCall('sc-resolve-project', { ref: c.project }) : Promise.resolve(null);
        groups.forEach(function (g) {
          chain = chain.then(function (pr) {
            return (pr ? addToProject(g, pr) : createOne(g, extra)).then(function (res) { made.push(res); g.input.disabled = true; return pr; });
          });
        });
        var webErr = null;
        if (webGroup) chain = chain.then(function (prev) {
          return scCall('sc-resolve-project', { ref: webRef }).then(function (pr) {
            return addToProject(webGroup, pr, webGroup.input.value.trim() || ddmmyy() + ' web');
          }).then(function (res) { res.enDocs = true; made.push(res); webGroup.input.disabled = true; return prev; },
            function (e) { webErr = e; return prev; });   /* ошибка веба не мешает отправить английский android/ios */
        });
        var enRes = [];
        if (enFiles.length) chain = chain.then(function () { return sendEnglish().then(function (r) { enRes = r; }); });
        chain.then(function () {
          if (webErr) throw new Error('веб («' + webRef + '»): ' + webErr.message);
        }).then(function () {
          msg.className = 'ok';
        }, function (e) {
          btn.disabled = false; msg.className = 'red';
          msg.appendChild(el('div', { text: '✗ ' + e.message }));
        }).then(function () {
          renderScImport();
          autoDone({ made: made.map(function (p) { return p.name + (p.docs != null ? ' (' + p.docs + ' док.)' : ''); }),
            en: enRes.map(function (x) { return (x.ok ? '' : '✗ ') + x.text; }), error: msg.className === 'red' ? msg.textContent.slice(0, 200) : '' });
          if (!made.length) return;
          if (msg.className !== 'red') msg.textContent = '';
          msg.insertBefore(el('div', {}, [document.createTextNode(c.project ? '✓ Файлы добавлены: ' : '✓ Созданы проекты: ')].concat(made.map(function (p, i) {
            return el('span', {}, [i ? ', ' : '', el('a', { href: c.base + '/projects/' + p.id, target: '_blank', text: p.name }),
              p.docs != null ? ' (' + p.docs + ' док.)' : '']);
          })).concat([document.createTextNode('. Когда Smartcat переведёт, придёт уведомление Chrome 🔔 — тогда в блоке «2. Перевод готов» нажми «⬆ В Weblate».')])), msg.firstChild);
          scCall('sc-watch-now').catch(function () {});
          enRes.forEach(function (x) {
            msg.appendChild(el('div', { class: x.ok ? 'ok' : 'red', text: (x.ok ? '✓ Английский: ' : '✗ Английский: ') + x.text }));
          });
          /* назначить переводчиков на английские документы (EN android / EN ios / веб) */
          var enDocIds = [].concat.apply([], enRes.filter(function (x) { return x.ok && x.docIds; }).map(function (x) { return x.docIds; }))
            .concat([].concat.apply([], made.filter(function (p) { return p.enDocs && p.docIds; }).map(function (p) { return p.docIds; })));
          var who = c.enAssign || [];
          if (enDocIds.length && c.enAssignOn !== false && who.length) {
            var am = el('div', { class: 'muted', text: 'Назначаю на английский: ' + who.map(function (x) { return x.name; }).join(', ') + '…' });
            msg.appendChild(am);
            scCall('sc-assign', { documentIds: enDocIds, userIds: who.map(function (x) { return x.id; }) }).then(function () {
              am.className = 'ok'; am.textContent = '✓ Английский (' + enDocIds.length + ' док.) — назначены: ' + who.map(function (x) { return x.name; }).join(', ') + ' (все, кто примет)';
            }, function (e) { am.className = 'red'; am.textContent = '✗ Не получилось назначить переводчиков: ' + e.message + ' — назначь в Smartcat вручную'; });
          } else if (enDocIds.length && !who.length) {
            msg.appendChild(el('div', { class: 'muted', text: 'Переводчики на английский не назначены — выбрать их можно в ⚙ → «Назначать на английский».' }));
          }
          made.forEach(function (p) {
            (p.lost || []).forEach(function (t) {
              msg.appendChild(el('div', { class: 'red', text: /^языков нет/.test(t) ? p.name + ': ' + t : 'Не поняла, к какому компоненту/языку относится: ' + t }));
            });
          });
        });
      } });
      box.appendChild(el('div', { class: 'row' }, [btn]));
      box.appendChild(msg);
      return btn;
    });
  }

  /* ----- import logic ----- */
  var uploads = [];
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });

  function savedComps() { try { return JSON.parse(sget('wlx_comps') || '[]'); } catch (e) { return []; } }
  function defaultProject() {
    var sc = savedComps(), l = parseLinks(location.pathname);
    return sc.length ? sc[0].p : l.length ? l[0].p : 'global_site';
  }
  function withTranslations(p, c) {
    return projectComponents(p).catch(function () {}).then(function () { return translations(p, c); })
      .then(function (trs) { return { p: p, c: c, trs: trs }; }, function () { return null; });
  }
  function byRuName(folder, trs) {
    var f = (folder || '').trim().toLowerCase();
    if (!f) return null;
    var hit = trs.filter(function (t) { return langName(t.language.code).toLowerCase() === f; });
    return hit.length === 1 ? hit[0].language.code : null;
  }
  /* имя файла без языка → компонент: сначала среди компонентов прошлой выгрузки */
  function compNorm(x) { return String(x || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  /* все компоненты проектов, с которыми работаем (для поиска по имени и ручного выбора) */
  function knownComps() {
    var projects = [defaultProject(), 'global_site'];
    savedComps().concat(parseLinks(location.pathname)).forEach(function (x) { if (projects.indexOf(x.p) < 0) projects.push(x.p); });
    return Promise.all(projects.filter(function (p, i, a) { return p && a.indexOf(p) === i; }).map(function (p) {
      return projectComponents(p).catch(function () { return []; });
    })).then(function (lists) {
      var seen = {}, out = [];
      [].concat.apply([], lists).concat(savedComps()).forEach(function (x) {
        if (x.glossary || seen[x.p + '/' + x.c]) return;
        seen[x.p + '/' + x.c] = 1; out.push({ p: x.p, c: x.c });
      });
      return out;
    });
  }
  function resolveComponent(key) {
    var sc = savedComps(), last = function (c) { return c.split('/').pop(); };
    var cands = sc.filter(function (x) { return fileKey(x.c) === key || x.c === key || x.p + '-' + fileKey(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c).slice(-(key.length + 1)) === '-' + key; });
    if (cands.length > 1) return Promise.resolve(null);
    if (cands[0]) return withTranslations(cands[0].p, cands[0].c);
    var dp = defaultProject();
    if (key.indexOf(dp + '-') === 0) key = key.slice(dp.length + 1);   // global_site-wb-ios_new → wb-ios_new
    var n = compNorm(key);
    if (n.length < 2) return Promise.resolve(null);
    /* по всем компонентам: без учёта регистра и дефисов (aiAssistant → ai-assistant), потом по окончанию (→ wb-web-ai-assistant) */
    return knownComps().then(function (all) {
      var hit = all.filter(function (x) { return compNorm(fileKey(x.c)) === n || compNorm(last(x.c)) === n || compNorm(x.p + '-' + fileKey(x.c)) === n; });
      if (!hit.length && n.length >= 4) hit = all.filter(function (x) { var m = compNorm(last(x.c)); return m.length > n.length && m.slice(-n.length) === n; });
      if (hit.length === 1) return withTranslations(hit[0].p, hit[0].c);
      if (hit.length > 1) return null;
      return withTranslations(dp, key.split('__').join('/'));
    });
  }
  /* из .json с плюралками убираем то, что осталось на русском (не переведено) */
  /* для плюралки: какую русскую форму выгрузка подставляет в каждый ключ («ключ_one» → «{{count}} товар», «ключ_other» → «{{count}} товаров»…) */
  function pluralPlaceholders(x, fmt, srcCode, tgtCode) {
    var out = {};
    if (!x.source || x.source.length < 2 || !x.context) return out;
    var n = x.target && x.target.length > 1 ? x.target.length : pluralCats(tgtCode).length;
    var tgtCats = fitCats(pluralCats(tgtCode), n), srcCats = fitCats(pluralCats(srcCode), x.source.length);
    pluralSuffixes(fmt, tgtCode, n).forEach(function (suf, i) {
      var j = Math.min(i, x.source.length - 1);
      if (tgtCats && srcCats) {
        j = srcCats.indexOf(tgtCats[i]);
        if (j < 0) j = srcCats.indexOf('many') >= 0 ? srcCats.indexOf('many') : x.source.length - 1;
      }
      out[x.context + suf] = x.source[j];
    });
    return out;
  }
  /* из .json с плюралками убираем то, что не переведено: строка, где ВСЕ формы совпадают с русскими заготовками выгрузки.
     Если хоть одна форма другая — переводчик строку трогал, оставляем (в киргизском «{{count}} товар» — это перевод). */
  function stripJson(u) {
    var keys = Object.keys(u.obj);
    if (keys.some(function (k) { return typeof u.obj[k] !== 'string'; })) return Promise.resolve(u);
    return Promise.all([units(u.p, u.c, u.lang, 'has:plural'), componentFormat(u.p, u.c), withTranslations(u.p, u.c)]).then(function (res) {
      var list = res[0], fmt = res[1], trs = res[2] ? res[2].trs : [];
      var srcT = trs.filter(function (t) { return t.is_source; })[0], srcCode = srcT ? srcT.language.code : 'ru';
      var anySrc = {}, drop = {}, owned = {};
      list.forEach(function (x) { (x.source || []).forEach(function (s) { anySrc[s] = 1; }); });
      list.forEach(function (x) {
        if (!x.context) return;
        var ph = pluralPlaceholders(x, fmt, srcCode, u.lang);
        var mine = keys.filter(function (k) { return k === x.context || k.indexOf(x.context + '_') === 0; });
        if (!mine.length) return;
        mine.forEach(function (k) { owned[k] = 1; });
        var untouched = mine.every(function (k) { var v = u.obj[k]; return !v || (k in ph ? v === ph[k] : anySrc[v]); });
        if (untouched) mine.forEach(function (k) { drop[k] = 1; });
      });
      var kept = {}, dropped = 0;
      keys.forEach(function (k) {
        var v = u.obj[k];
        if (!v || drop[k] || (!owned[k] && anySrc[v])) dropped++; else kept[k] = v;
      });
      u.filled = Object.keys(kept).length;
      u.text = JSON.stringify(kept, null, 2) + '\n';
      if (!u.filled) u.skip = 'всё ещё на русском — похоже, не переведено, пропущу';
      else if (dropped) u.note = dropped + ' ещё на русском — их не отправлю';
      return u;
    }, function () { u.note = 'не смогла сверить с исходником'; return u; });
  }
  function detect(f) {
    var isJson = /\.json$/i.test(f.name), h = {};
    var u = { name: f.name, text: f.text };
    if (isJson) {
      try { u.obj = JSON.parse(f.text); } catch (e) { u.error = 'файл .json не читается'; return Promise.resolve(u); }
      var vals = Object.keys(u.obj).map(function (k) { return u.obj[k]; });
      u.total = vals.length;
      u.filled = vals.filter(function (v) { return v !== ''; }).length;
    } else {
      applyPoFix(u);
      var inf = poInfo(u.text);
      h = inf.headers; u.filled = inf.filled; u.total = inf.total;
      if (!inf.filled) u.skip = 'в файле нет переведённых строк — пропущу';
      var lt = /\/projects\/([^\s>"]+)/.exec(h['Language-Team'] || '');
      var segs = lt ? lt[1].split('/').filter(Boolean) : [];
      if (segs.length >= 3) {
        u.p = segs[0]; u.c = segs.slice(1, -1).join('/'); u.lang = segs[segs.length - 1];
        return withTranslations(u.p, u.c).then(function (r) {
          if (!r) u.error = 'компонент «' + u.c + '» не найден';
          return u;
        });
      }
    }
    var parts = f.name.split('/'), base = parts.pop().replace(/\.(po|json)$/i, '').replace(/\s*\(\d+\)$/, '');
    /* плюралки: «wb-web-loyalty_kk_plural form», «…_plural form(kk)», «…_plural form.kk», «…_plural form (1)» */
    var plm = /^(.*?)[ _.-]*plurals?(?:[ _-]*forms?)?(?:[ ._-]*\(?([A-Za-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)\)?)?$/i.exec(base), plAlt = '';
    if (plm && plm[1]) { base = plm[1]; plAlt = plm[2] || ''; }
    var namePart = base, wanted = h['Language'] || '', alt = plAlt;
    /* как из Smartcat: «b2b.kk(kk)», «aiAssistant.az(az-Latn)», «kk(kk)» */
    var scm = /^(.*?)[._ -]?([A-Za-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)\(([^)]+)\)$/.exec(base);
    var suffix = !scm && /^(.+)[._-]([a-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)$/.exec(base);
    if (scm) { namePart = scm[1]; wanted = wanted || scm[2]; alt = scm[3]; }
    else if (!suffix && plAlt) { wanted = wanted || plAlt; }
    else if (suffix) { namePart = suffix[1]; wanted = wanted || suffix[2]; }
    var folder = parts.length ? parts[parts.length - 1] : '';
    var folderLang = folder === ENGLISH_DIR ? 'en' : folder;
    if (!wanted && (!scm && !suffix)) wanted = '';
    /* компонент: из имени файла, иначе из папки (wb-web-ai-assistant/kk(kk).po) */
    var cands = [namePart, folder, parts[parts.length - 2]].filter(function (x, i, a) { return x && x !== ENGLISH_DIR && a.indexOf(x) === i; });
    u.c = namePart || folder;
    u.want = { lang: wanted || folderLang, alt: alt, folder: folderLang };
    if (!wanted && !folderLang) { u.error = 'не понятно, какой это язык'; return Promise.resolve(u); }
    function tryNext(i) {
      if (i >= cands.length) return Promise.resolve(null);
      return resolveComponent(cands[i]).then(function (r) { return r || tryNext(i + 1); });
    }
    return tryNext(0).then(function (r) {
      if (!r) { u.error = 'не нашла компонент «' + u.c + '» — выбери его в колонке «Куда»'; u.needComp = true; return u; }
      return applyComp(u, r, isJson);
    });
  }
  /* компонент найден (или выбран руками) → язык → готово */
  function applyComp(u, r, isJson) {
    u.p = r.p; u.c = r.c; delete u.error; delete u.needComp;
    var w = u.want || {};
    u.lang = (w.lang && matchLanguage(String(w.lang).replace('-', '_'), r.trs)) || (w.alt && matchLanguage(String(w.alt).replace(/-/g, '_'), r.trs)) ||
      (w.alt && matchLanguage(baseLang(w.alt), r.trs)) || byRuName(w.folder, r.trs);
    if (!u.lang) { u.error = 'язык «' + (w.lang || w.alt || '?') + '» не найден в компоненте «' + r.c + '»'; return u; }
    return isJson ? stripJson(u) : u;
  }
  function addFiles(list) {
    errU.textContent = '';
    var files = Array.prototype.slice.call(list || []);
    Promise.all(files.map(function (file) {
      if (/\.zip$/i.test(file.name)) return file.arrayBuffer().then(readZip);
      if (/\.(po|json)$/i.test(file.name)) return file.text().then(function (t) { return [{ name: file.name, text: t }]; });
      return Promise.resolve([]);
    })).then(function (groups) {
      var all = [].concat.apply([], groups);
      if (!all.length) throw new Error('Не нашла .po файлов');
      return Promise.all(all.map(detect)).then(withPlurals);
    }).then(function (found) {
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name) ? 'json' : 'po'; };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
    }).catch(function (e) { errU.textContent = friendly(e); });
  }
  function poStr(s) { return String(s || '').replace(/\\(["\\nt])/g, function (m, c) { return c === 'n' ? '\n' : c === 't' ? '\t' : c; }); }
  /* плюралки в .po для json-компонентов (i18next): Weblate их из .po не принимает (у русского 3 формы, в .po влезает 2) —
     выносим в отдельный «…_plural form.json», а из .po убираем */
  function splitPoPlurals(u) {
    if (!u || u.error || !u.p || !u.c || !u.lang || !u.text || /\.json$/i.test(u.name)) return Promise.resolve(null);
    var es = poEntries(u.text);
    if (!es.some(function (e) { return !e.header && e.plural; })) return Promise.resolve(null);
    return componentFormat(u.p, u.c).then(function (fmt) {
      if (!/i18next|json/i.test(fmt || '')) return null;
      var pl = es.filter(function (e) { return !e.header && !e.obsolete && e.plural; });
      u.text = es.filter(function (e) { return e.header || !e.plural; }).map(function (e) { return e.lines.join('\n'); }).join('\n\n') + '\n';
      var inf = poInfo(u.text);
      u.filled = u.fromSc || u.scImp ? inf.withText : inf.filled; u.total = inf.total;
      if (!u.filled && !u.skip) u.skip = 'кроме плюралок переводить нечего';
      var cats = pluralCats(u.lang), sufs = pluralSuffixes(fmt, u.lang, cats.length), obj = {}, n = 0;
      pl.forEach(function (e) {
        var forms = e.strs.map(poStr);
        if (!forms.some(Boolean) || !e.ctx) return;
        n++;
        var ctx = poStr(e.ctx);
        sufs.forEach(function (suf, i) {
          var v = forms.length === 1 ? forms[0] : forms[i];      // одна форма в .po (грузинский) — во все ключи
          if (v) obj[ctx + suf] = v;
        });
      });
      u.note = (u.note ? u.note + ' · ' : '') + 'плюралки (' + pl.length + ') вынесла в .json — из .po Weblate их не принимает';
      if (!n) return null;
      return { name: u.name.replace(/\.po$/i, '') + ' — плюралки.json', text: JSON.stringify(obj, null, 2) + '\n', obj: obj,
        p: u.p, c: u.c, lang: u.lang, filled: Object.keys(obj).length, total: Object.keys(obj).length, derived: true,
        fromSc: u.fromSc, scKey: u.scKey, scImp: u.scImp, opts: u.opts, note: 'плюралки из .po' };
    }, function () { return null; });
  }
  /* добавить к файлам вынесенные плюралки; если подрядчик прислал свой json на тот же компонент и язык — берём его */
  function withPlurals(list) {
    return Promise.all(list.map(splitPoPlurals)).then(function (extra) {
      var real = list.concat(uploads).filter(function (x) { return /\.json$/i.test(x.name) && !x.derived && !x.error; });
      extra.forEach(function (d) {
        if (!d) return;
        if (real.some(function (x) { return x.p === d.p && x.c === d.c && x.lang === d.lang; })) return;
        list.push(d);
      });
      return list;
    });
  }
  /* какие строки не легли: сверяем файл со строками в Weblate */
  function explainUpload(u) {
    var o = u.usedOpts || {};
    return units(u.p, u.c, u.lang, '').then(function (list) {
      var byCtx = {}, bySrc = {};
      list.forEach(function (x) { if (x.context) byCtx[x.context] = x; bySrc[(x.source || []).join('\u001e')] = x; });
      var items = [];
      if (/\.json$/i.test(u.name)) {
        var obj = {}; try { obj = JSON.parse(u.text); } catch (e) {}
        Object.keys(obj).forEach(function (k) { items.push({ key: k, alt: k.replace(/_(zero|one|two|few|many|other|plural|\d+)$/, ''), src: '', val: obj[k] }); });
      } else {
        poEntries(u.text).forEach(function (e) {
          if (e.header || e.obsolete || !e.strs.some(Boolean)) return;
          var k = poStr(e.ctx);
          items.push({ key: k, alt: k, src: poStr(e.msgid), val: e.strs.map(poStr).join(' | ') });
        });
      }
      var out = [];
      items.forEach(function (it) {
        var x = (it.key && (byCtx[it.key] || byCtx[it.alt])) || (!it.key && Object.keys(bySrc).filter(function (k) { return k.split('\u001e')[0] === it.src; }).map(function (k) { return bySrc[k]; })[0]);
        var label = it.key ? it.key + (it.src ? ' — «' + it.src.slice(0, 50) + (it.src.length > 50 ? '…' : '') + '»' : '') : it.src.slice(0, 60);
        if (!x) {
          out.push({ label: label, why: 'нет такой строки в компоненте (не найдено)', href: '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent(it.key ? 'context:"' + it.alt + '"' : 'source:"' + it.src.slice(0, 60) + '"') });
          return;
        }
        var tgt = (x.target || []).join(' | '), st = x.state || 0, why = '';
        if (st >= 100) why = 'строка только для чтения';
        else if (tgt && tgt === it.val) return;                                   // такой же перевод уже есть — не проблема
        else if (!o.conflicts && st >= 20) why = 'уже переведена — режим «только непереведённые» её не трогает';
        else if (o.conflicts === 'replace-translated' && st >= 30) why = 'одобрена — режим «переведённые» одобренные не трогает';
        else return;
        out.push({ label: label, why: why, href: x.web_url || x.translate_url || ('/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent('context:"' + (x.context || '') + '"')) });
      });
      return out;
    });
  }
  /* ручной выбор компонента, если по имени не нашёлся */
  var compListId = 'wlx-comps-' + Math.random().toString(16).slice(2), pickComps = null;   // не путать с compList на вкладке «Выгрузить»
  function compPicker(u) {
    var inp = el('input', { type: 'text', list: compListId, placeholder: 'начни вводить компонент…', class: 'pick' });
    var ok = el('button', { class: 'b s', text: 'OK', onclick: function () {
      var v = inp.value.trim(), all = pickComps || [];
      var x = all.filter(function (c) { return c.p + '/' + c.c === v || c.c === v; })[0];
      if (!x) { inp.style.borderColor = '#c0392b'; return; }
      ok.disabled = true;
      withTranslations(x.p, x.c).then(function (r) {
        if (!r) throw new Error('нет доступа к компоненту');
        return applyComp(u, r, /\.json$/i.test(u.name));
      }).then(function () {
        uploads = uploads.filter(function (y) { return y === u || !(y.p === u.p && y.c === u.c && y.lang === u.lang && /\.json$/i.test(y.name) === /\.json$/i.test(u.name)); });
        renderPreview();
      }, function (e) { ok.disabled = false; inp.title = e.message; inp.style.borderColor = '#c0392b'; });
    } });
    if (!pickComps) knownComps().then(function (all) {
      pickComps = all;
      var dl = root.getElementById ? root.getElementById(compListId) : null;
      if (!dl) { dl = el('datalist', { id: compListId }); root.appendChild(dl); }
      all.forEach(function (c) { dl.appendChild(el('option', { value: c.p + '/' + c.c })); });
    });
    return el('td', {}, [el('div', { class: 'row', style: 'margin:0;gap:6px;flex-wrap:nowrap' }, [inp, ok])]);
  }
  function renderPreview() {
    preview.textContent = ''; upResults.textContent = '';
    if (!uploads.length) { upSec.classList.add('hide'); return; }
    preview.appendChild(el('h2', { text: 'Готово к загрузке' }));
    var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Файл' }), el('th', { text: 'Куда' }),
      el('th', { class: 'n', text: 'С переводом' }), el('th', { text: 'Статус' })])]);
    uploads.forEach(function (u) {
      u.row = el('td', { class: u.error ? 'red' : (u.sent ? 'ok' : 'muted'), text: u.error || u.status || u.skip || (u.note ? 'готов · ' + u.note : 'готов') });
      t.appendChild(el('tr', {}, [
        (function () {
          var vr = varScan(u), hn = vr ? vr.filter(function (x) { return x.hard; }).length : 0;
          return el('td', {}, [el('div', { text: u.name }), vr ? el('div', { class: hn ? 'red' : 'muted',
            text: '⚠ проверка: ' + vr.length + ' стр.' + (hn ? (varSkip.checked ? ' — с ошибкой не загружу: ' + hn : ', с ошибкой: ' + hn) : ' — проверь') }) : null]);
        })(),
        u.lang ? el('td', { title: u.p + '/' + u.c + '/' + u.lang }, [el('div', { text: u.c }), langLabel(u.lang)]) : u.needComp ? compPicker(u) : el('td', { text: '—' }),
        el('td', { class: 'n', text: u.filled + ' из ' + u.total }),
        u.row
      ]));
    });
    preview.appendChild(t);
    var withVars = uploads.filter(function (u) { return varScan(u); });
    if (withVars.length) {
      var vt = el('table', {}, [el('tr', {}, [el('th', { text: 'Где' }), el('th', { text: 'Ключ' }), el('th', { text: 'Перевод' }), el('th', { text: 'Что не так' })])]);
      var vn = 0, vh = 0;
      withVars.forEach(function (u) {
        u.vars.forEach(function (x) {
          vn++; if (x.hard) vh++;
          vt.appendChild(el('tr', {}, [el('td', { text: u.c + ' · ' + langName(u.lang) }),
            el('td', {}, [el('a', { href: '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent(x.ctx ? 'context:"' + x.ctx + '"' : 'source:"' + x.src.slice(0, 60) + '"'), target: '_blank', text: x.ctx || x.src.slice(0, 50) })]),
            el('td', { class: 'brtr', text: x.tr }),
            el('td', {}, x.probs.map(function (p) { return el('div', { class: p.hard ? 'red' : 'muted', text: (p.hard ? '✗ ' : '? ') + p.text }); }))]));
        });
      });
      preview.appendChild(el('details', vh ? { open: '' } : {}, [el('summary', { class: vh ? 'red' : 'muted',
        text: 'Проверка переводов (переменные, мусор от машперевода) — строк: ' + vn + (vh ? ', с ошибкой: ' + vh : '') + ' (✗ — ошибка, ? — проверь глазами)' }), vt]));
    }
    preview.appendChild(el('div', { class: 'row' }, [
      el('span', { class: 'muted', text: 'Файлов: ' + uploads.length }),
      el('button', { class: 'b g s', text: 'Очистить список', onclick: function () { uploads = []; renderPreview(); } })
    ]));
    upSec.classList.remove('hide');
  }
  /* ----- «Из Smartcat»: забрать машинный перевод и подготовить к загрузке ----- */
  /* список отправок в Smartcat: на вкладке загрузки — «Забрать переводы» (проверить и загрузить вручную),
     на вкладке Smartcat — «Забрать и загрузить в Weblate» одной кнопкой */
  function renderScList(box, auto) {
    box.textContent = '';
    if (!HAS_EXT) { box.classList.add('hide'); return; }
    var list = scProjects();
    box.classList.remove('hide');
    var findMsg = el('span', { class: 'muted' });
    var findBtn = el('button', { class: 'b g s', text: '🔎 Найти отправки', title: 'Восстановить список по файлам в проекте Smartcat за последние 2 недели',
      onclick: function () { recoverScProjects(findBtn, findMsg); } });
    var pending = list.filter(function (pr) { return !pr.uploaded; });
    var allMsg = el('span', { class: 'muted' });
    var allBtn = el('button', { class: 'b s', text: '⬆ Загрузить всё готовое (' + pending.length + ')',
      title: 'Забрать из Smartcat все ещё не загруженные отправки и загрузить их в Weblate одним разом',
      onclick: function () { uploadAllReady(allBtn, allMsg); } });
    /* галочки: загрузить или убрать только отмеченные отправки */
    var keyOf = function (pr) { return pr.key || pr.id; };
    Object.keys(scSel).forEach(function (k) { if (!list.some(function (pr) { return keyOf(pr) === k; })) delete scSel[k]; });
    var picked = function () { return list.filter(function (pr) { return scSel[keyOf(pr)]; }); };
    var selBtn = el('button', { class: 'b s', title: 'Забрать из Smartcat отмеченные отправки и загрузить в Weblate одним разом',
      onclick: function () { uploadAllReady(selBtn, allMsg, picked()); } });
    var selDel = el('button', { class: 'b g s', text: '× Убрать отмеченные', onclick: function () {
      var ks = picked().map(keyOf);
      saveScProjects(scProjects().filter(function (x) { return ks.indexOf(keyOf(x)) < 0; }));
      ks.forEach(function (k) { delete scSel[k]; }); renderScImport();
    } });
    var selAll = el('input', { type: 'checkbox', title: 'Отметить все / снять' });
    function updSel() {
      var n = picked().length;
      selBtn.textContent = '⬆ Загрузить отмеченные (' + n + ')';
      selBtn.classList.toggle('hide', !n); selDel.classList.toggle('hide', !n);
      allBtn.classList.toggle('hide', !!n || !pending.length);
      selAll.checked = n > 0 && n === list.length; selAll.indeterminate = n > 0 && n < list.length;
    }
    var boxes = [];
    selAll.addEventListener('change', function () {
      list.forEach(function (pr) { if (selAll.checked) scSel[keyOf(pr)] = 1; else delete scSel[keyOf(pr)]; });
      boxes.forEach(function (b) { b.checked = selAll.checked; }); updSel();
    });
    box.appendChild(el('div', { class: 'head' }, [el('h3', { text: '2. Перевод готов → в Weblate' }), findBtn]));
    box.appendChild(el('p', { class: 'hint', text: 'Отправки из блока 1. Когда Smartcat переведёт, придёт уведомление 🔔 — загрузка идёт только в непереведённые строки.' }));
    box.appendChild(findMsg);
    if (list.length) box.appendChild(el('div', { class: 'row' }, [el('label', { class: 'chk' }, [selAll, 'все']), allBtn, selBtn, selDel, allMsg]));
    else box.appendChild(el('p', { class: 'muted', text: 'Отправок пока нет. Если они были, но пропали — «🔎 Найти отправки».' }));
    scRows = {};
    list.forEach(function (pr) {
      var st = el('span', { class: pr.uploaded ? 'ok' : 'muted',
        text: pr.uploaded ? '✓ загружено в Weblate ' + fmtDate(pr.uploaded) : (scReady[pr.key || pr.id] ? '🔔 перевод в Smartcat готов' : '') });
      var get = el('button', { class: 'b s', text: '⬆ В Weblate', title: 'Забрать готовые переводы из Smartcat и загрузить в Weblate («только непереведённые строки»)',
        onclick: function () { fetchSc(pr, st, get, auto); } });
      var zip = el('button', { class: 'b g s', text: '⬇ ZIP', title: 'Скачать готовые переводы из Smartcat архивом (в Weblate ничего не загружается)',
        onclick: function () { zipSc(pr, st, zip); } });
      var del = el('button', { class: 'b g s', text: '×', title: 'Убрать из списка', onclick: function () {
        saveScProjects(scProjects().filter(function (x) { return (x.key || x.id) !== (pr.key || pr.id); })); renderScImport();
      } });
      scRows[pr.key || pr.id] = { st: st, get: get };
      var cb = el('input', { type: 'checkbox', title: 'Отметить' });
      cb.checked = !!scSel[keyOf(pr)]; boxes.push(cb);
      cb.addEventListener('change', function () { if (cb.checked) scSel[keyOf(pr)] = 1; else delete scSel[keyOf(pr)]; updSel(); });
      box.appendChild(el('div', { class: 'scrow' }, [cb,
        el('div', { class: 'grow' }, [el('b', { text: String(pr.name || '').split(' / ').pop() }),
          el('div', { class: 'muted' }, [String(pr.name || '').split(' / ').slice(0, -1).join(' / ') + (pr.created ? ' · ' + fmtDate(pr.created) + ' ' : ' '), st])]),
        get, zip, del]));
    });
    updSel();
  }
  var scRows = {}, scReady = {}, scSel = {};
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  /* забрать все незагруженные отправки и загрузить одним разом */
  function uploadAllReady(btn, msg, only) {
    var list = only || scProjects().filter(function (pr) { return !pr.uploaded; });
    if (!list.length) { msg.textContent = 'Всё уже загружено'; return; }
    btn.disabled = true; msg.className = 'muted'; msg.textContent = 'Забираю из Smartcat…';
    var keys = [];
    list.reduce(function (chain, pr) {
      return chain.then(function () {
        var r = scRows[pr.key || pr.id];
        keys.push(pr.key || pr.id);
        return fetchSc(pr, r.st, r.get, 'collect');
      });
    }, Promise.resolve()).then(function () {
      var mine = uploads.filter(function (u) { return keys.indexOf(u.scKey) >= 0 && !u.error && !u.skip && !u.sent; });
      if (!mine.length) { msg.className = 'red'; msg.textContent = 'Загружать нечего — у каждой отправки причина написана в строке'; return; }
      msg.className = 'ok'; msg.textContent = '✓ Загружаю ' + mine.length + ' файл(ов) — результат на вкладке «Загрузить обратно»';
      keys.forEach(function (k) { delete scSel[k]; });
      tab('imp');
      runUpload(function (u) { return keys.indexOf(u.scKey) >= 0; });
    }).catch(function (e) { msg.className = 'red'; msg.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* скачать готовые переводы отправки архивом: <папка>/<проект>-<компонент>-<язык>.po */
  function zipSc(pr, st, btn) {
    btn.disabled = true; st.className = 'muted'; st.textContent = 'Проверяю проект…';
    var folder = String(pr.name || '').split(' / ').pop() || ddmmyy();
    scCall('sc-project', { id: pr.id }).then(function (proj) {
      var docs = (proj.documents || []).filter(function (d) { return !pr.docs || pr.docs[d.id]; });
      var ready = docs.filter(function (d) {
        return (!d.documentDisassemblingStatus || d.documentDisassemblingStatus === 'success') && d.pretranslateCompleted !== false;
      });
      if (!ready.length) { st.textContent = docs.length ? 'Smartcat ещё переводит (готово 0 из ' + docs.length + ') — попробуй позже' : 'В проекте больше нет этих документов'; return; }
      var files = [], n = 0;
      st.textContent = 'Скачиваю ' + ready.length + ' из ' + docs.length + '…';
      return pool(ready, 3, function (d) {
        var info = pr.docs && pr.docs[d.id];
        var name = info ? info.p + '-' + fileKey(info.c) + '-' + info.lang : scDocKey(d.name) + '-' + d.targetLanguage;
        return scCall('sc-export', { documentId: d.id }).then(function (r) {
          var isJ = (info && info.json) || /^\s*[\[{]/.test(r.text);
          files.push({ name: folder + '/' + (isJ && info ? poName({ p: info.p, component: info.c, language: info.lang, ext: 'json' }) : name + (isJ ? '.json' : '.po')), text: r.text });
          st.textContent = 'Скачано ' + (++n) + ' из ' + ready.length + '…';
        }, function (e) { files.push({ name: folder + '/ОШИБКА_' + name + '.txt', text: String(e.message || e) }); });
      }).then(function () {
        files.sort(function (a, b) { return a.name.localeCompare(b.name); });
        saveBlob(makeZip(files), 'smartcat_' + folder + '.zip');
        st.className = 'ok';
        st.textContent = '✓ Скачан архив: ' + n + ' файл(ов)' + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '');
      });
    }).catch(function (e) { st.className = 'red'; st.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* восстановить отправки по документам проекта: «global_site-wb-android-hy» → компонент + язык, дата загрузки → папка */
  function recoverScProjects(btn, msg) {
    btn.disabled = true; msg.className = 'muted'; msg.textContent = 'Смотрю проект в Smartcat…';
    loadScConfig().then(function (c) {
      if (!c || !c.accountId || !c.hasKey) throw new Error('Smartcat не подключён (⚙)');
      return scCall('sc-resolve-project', { ref: c.project || SC_PROJECT_DEFAULT }).then(function (pr) {
        return scCall('sc-project', { id: pr.id }).then(function (full) { return { pr: pr, docs: full.documents || [] }; });
      });
    }).then(function (x) {
      var known = {}, projects = ['global_site'];
      savedComps().concat(parseLinks(sget('wlx_mt_links') || SC_DEFAULT_LINKS)).forEach(function (l) { if (projects.indexOf(l.p) < 0) projects.push(l.p); });
      scProjects().forEach(function (e) { Object.keys(e.docs || {}).forEach(function (id) { known[id] = 1; }); });
      var since = Date.now() - 14 * 864e5, groups = {};
      x.docs.forEach(function (d) {
        if (known[d.id]) return;
        var t = Date.parse(d.creationDate || d.created || '');
        if (t && t < since) return;
        var name = scDocKey(d.name).replace(/\s*\(\d+\)$/, '');
        var m = /^(.+)-([a-z]{2,3}(?:_[A-Za-z0-9]+)?)$/.exec(name);
        if (!m) return;
        var proj = projects.filter(function (p) { return m[1].indexOf(p + '-') === 0; })[0];
        if (!proj) return;
        var comp = m[1].slice(proj.length + 1).split('__').join('/');
        var day = t ? new Date(t) : new Date();
        var dd = ('0' + day.getDate()).slice(-2) + ('0' + (day.getMonth() + 1)).slice(-2) + String(day.getFullYear()).slice(-2);
        var folder = dd + '_' + scPlatform(proj, comp);
        var g = groups[folder] = groups[folder] || { docs: {}, t: t || Date.now() };
        g.docs[d.id] = { p: proj, c: comp, lang: m[2] };
      });
      var names = Object.keys(groups);
      if (!names.length) { msg.textContent = 'Новых отправок за 2 недели не нашла'; return; }
      var list = scProjects();
      names.forEach(function (folder) {
        var key = x.pr.id + '#' + folder, ex = list.filter(function (e) { return e.key === key; })[0];
        if (ex) { Object.keys(groups[folder].docs).forEach(function (id) { ex.docs[id] = groups[folder].docs[id]; }); return; }
        list.push({ key: key, id: x.pr.id, name: x.pr.name + ' / ' + folder, created: new Date(groups[folder].t).toISOString(), docs: groups[folder].docs, files: {}, langs: {} });
      });
      list.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
      saveScProjects(list);
      renderScImport();
    }).catch(function (e) { msg.className = 'red'; msg.textContent = '✗ ' + e.message; btn.disabled = false; });
  }
  function renderScImport() { renderScList(scBack, true); }
  function scDocKey(name) { return String(name || '').split('/').pop().replace(/\.(po|json)$/i, ''); }
  function fetchSc(pr, st, btn, auto) {
    var prKey = pr.key || pr.id;
    btn.disabled = true; st.className = 'muted'; st.textContent = 'Проверяю проект…';
    return scCall('sc-project', { id: pr.id }).then(function (proj) {
      var docs = (proj.documents || []).filter(function (d) { return !pr.docs || pr.docs[d.id]; });
      if (pr.docs && !docs.length) { st.className = 'red'; st.textContent = 'В проекте больше нет этих документов'; return; }
      var ready = docs.filter(function (d) {
        return (!d.documentDisassemblingStatus || d.documentDisassemblingStatus === 'success') && d.pretranslateCompleted !== false;
      });
      if (!ready.length) { st.textContent = 'Smartcat ещё переводит (готово 0 из ' + docs.length + ') — попробуй позже'; return; }
      var n = 0;
      st.textContent = 'Скачиваю ' + ready.length + ' из ' + docs.length + '…';
      return pool(ready, 3, function (d) {
        var key = scDocKey(d.name), comp = pr.docs ? pr.docs[d.id] : pr.files[key];
        var lang = (pr.docs && pr.docs[d.id].lang) || pr.langs[String(d.targetLanguage || '').toLowerCase()] ||
          Object.keys(pr.langs).map(function (k) { return pr.langs[k]; }).filter(function (l) { return baseLang(l) === baseLang(d.targetLanguage || ''); })[0];
        var u = { name: 'Smartcat/' + key + '.po', text: '', filled: 0, total: 0, fromSc: true, scKey: prKey };
        if (!comp || !lang) { u.error = 'не понимаю, куда это: документ «' + d.name + '», язык ' + d.targetLanguage; uploads.push(u); return Promise.resolve(); }
        u.p = comp.p; u.c = comp.c; u.lang = lang;
        return scCall('sc-export', { documentId: d.id }).then(function (r) {
          u.text = r.text;
          u.json = !!(comp && comp.json) || /^\s*[\[{]/.test(r.text);
          if (u.json) {
            try { u.obj = JSON.parse(r.text); } catch (e) { u.error = 'файл .json из Smartcat не читается'; return; }
            var vals = Object.keys(u.obj).map(function (k) { return u.obj[k]; });
            u.total = vals.length; u.filled = vals.filter(Boolean).length;
          } else {
            applyPoFix(u);
            var inf = poInfo(u.text);
            u.filled = inf.withText; u.total = inf.total;
            if (!inf.withText) u.skip = 'Smartcat вернул пустой перевод — машинный перевод в документе ещё не появился';
          }
          return withTranslations(u.p, u.c).then(function (w) {
            if (!w) { u.error = 'компонент «' + u.c + '» не найден в Weblate'; return; }
            var code = matchLanguage(u.lang, w.trs);           /* в старых именах бывает «uz» вместо «uz_Latn» */
            if (code) u.lang = code; else { u.error = 'языка ' + u.lang + ' нет в компоненте'; return; }
            if (u.json) { u.name = 'x.json'; return stripJson(u); }
          });
        }, function (e) { u.error = e.message; }).then(function () {
          uploads = uploads.filter(function (x) { return !(x.fromSc && x.p === u.p && x.c === u.c && x.lang === u.lang && !!x.json === !!u.json); });
          if (u.p && u.c) u.name = 'Smartcat/' + (u.json ? poName({ p: u.p, component: u.c, language: u.lang, ext: 'json' }) : scFileName({ p: u.p, component: u.c, language: u.lang }));
          uploads.push(u);
          st.textContent = 'Скачано ' + (++n) + ' из ' + ready.length + '…';
        });
      }).then(function () {
        renderPreview();
        st.className = 'ok';
        if (auto === 'collect') {
          st.textContent = '✓ Забрала ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '');
          return;
        }
        if (auto) {
          var ours = uploads.filter(function (u) { return u.scKey === prKey; });
          var mine = ours.filter(function (u) { return !u.error && !u.skip && !u.sent; }).length;
          if (mine) {
            st.textContent = '✓ Забрала ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '') +
              ', загружаю ' + mine + ' в Weblate («только непереведённые») — результат на вкладке «Загрузить обратно»';
            tab('imp'); runUpload(function (u) { return u.scKey === prKey; });
            return;
          }
          /* загружать нечего — показать почему */
          var why = {};
          ours.forEach(function (u) { var r = u.sent ? 'уже загружено' : (u.error || u.skip || '?'); why[r] = (why[r] || 0) + 1; });
          st.className = 'red';
          st.textContent = 'Забрала ' + n + ', но загружать нечего: ' + Object.keys(why).map(function (r) { return why[r] + ' × ' + r; }).join('; ') +
            '. Подробности — на вкладке «Загрузить обратно».';
          return;
        }
        st.textContent = '✓ Готово к загрузке: ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '') +
          '. Машинный перевод загрузится с «Изменять только непереведённые строки» — проверь список ниже и нажми «Загрузить в Weblate».';
      });
    }).catch(function (e) { st.className = 'red'; st.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  renderScImport();
  syncScProjects().then(function () {
    return HAS_EXT ? scCall('sc-ready-get').then(function (r) { scReady = r || {}; }, function () {}) : null;
  }).then(renderScImport);
  loadScConfig().then(function (c) {
    if (!c) return;
    fillSetupSelects(c);
    scSetupNote.textContent = 'проект: ' + (c.project || SC_PROJECT_DEFAULT);
  });

  function setRow(u, cls, text) { u.status = text; u.row.className = cls; u.row.textContent = text; }
  /* отправки Smartcat, у которых всё загрузилось, помечаем «загружено» */
  function markScUploaded(todo) {
    var keys = {};
    todo.forEach(function (u) { if (u.fromSc && u.scKey) keys[u.scKey] = 1; });
    var now = new Date().toISOString(), changed = false;
    var list = scProjects().map(function (pr) {
      var k = pr.key || pr.id;
      if (!keys[k]) return pr;
      var items = uploads.filter(function (u) { return u.scKey === k && !u.error && !u.skip; });
      if (items.length && items.every(function (u) { return u.sent; })) { pr.uploaded = now; changed = true; }
      return pr;
    });
    if (changed) { saveScProjects(list); renderScImport(); }
  }
  /* отчёт после загрузки — можно скопировать в чат */
  function uploadReport(todo, opts, took) {
    var d = new Date(), date = ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear() +
      ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var sent = todo.filter(function (u) { return u.sent; }), failed = todo.filter(function (u) { return !u.sent; });
    var lines = sum(sent, 'accepted');
    function sum(a, f) { return a.reduce(function (x, u) { return x + (Number(u[f]) || 0); }, 0); }
    var label = function (sel) { return sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ''; };
    var anySc = todo.some(function (u) { return u.fromSc; }), anyVendor = todo.some(function (u) { return !u.fromSc && !u.scImp; });
    var imp = todo.filter(function (u) { return u.scImp; })[0];
    var out = ['Загрузка в Weblate · ' + date + ' · ' + took,
      'Файлов: ' + sent.length + (failed.length ? ' (с ошибкой: ' + failed.length + ')' : '') + ' · строк принято: ' + lines.toLocaleString('ru-RU')];
    if (anySc) out.push('Машинный перевод Smartcat: «Добавить как перевод», «Изменять только непереведённые строки»');
    if (imp) out.push('Готовые переводы из Smartcat: «Добавить как перевод», «' + (imp.opts.conflicts ? 'Изменять переведённые строки' : 'Изменять только непереведённые строки') + '»');
    if (anyVendor) out.push('Файлы подрядчиков: «' + label(optMethod) + '», «' + label(optConf) + '»');
    var by = {};
    sent.forEach(function (u) { (by[u.p + '/' + u.c] = by[u.p + '/' + u.c] || []).push(u); });
    Object.keys(by).sort().forEach(function (k) {
      out.push(k.split('/').slice(1).join('/') + ': ' + by[k].sort(function (a, b) { return langName(a.lang).localeCompare(langName(b.lang), 'ru'); })
        .map(function (u) { return langName(u.lang) + ' ' + (u.accepted != null ? u.accepted : '✓'); }).join(', '));
    });
    var vsk = sent.filter(function (u) { return u.varSkipped; });
    if (vsk.length) {
      out.push('Не загружено строк с ошибкой: ' + sum(vsk, 'varSkipped') + ' (переменная или мусор от машперевода):');
      vsk.forEach(function (u) { u.vars.filter(function (x) { return x.hard; }).forEach(function (x) {
        out.push('  ' + u.c + ' · ' + langName(u.lang) + ' · ' + (x.ctx || x.src.slice(0, 40)) + ': ' + x.probs.filter(function (p) { return p.hard; })[0].text);
      }); });
    }
    failed.forEach(function (u) { out.push('✗ ' + (u.c || u.name) + ' · ' + (u.lang ? langName(u.lang) : '') + ': ' + (u.upError || 'не загружено')); });
    var fixedU = sent.filter(function (u) { return u.fixedKeys && u.fixedKeys.length; });
    if (fixedU.length) {
      out.push('Испорчены в Smartcat — не загружены, проверь вручную:');
      fixedU.forEach(function (u) { out.push('  ' + u.c + ' · ' + langName(u.lang) + ': ' + u.fixedKeys.join(', ')); });
    }
    var text = out.join('\n');
    var pre = el('pre', { class: 'report', text: text });
    var note = el('span', { class: 'muted' });
    var copy = el('button', { class: 'b g s', text: '📋 Скопировать отчёт', onclick: function () {
      var done = function () { note.textContent = 'Скопировано ✓'; };
      var fallback = function () {
        var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (e) { note.textContent = 'Не получилось — выдели текст и скопируй вручную'; }
        t.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    } });
    return el('div', { class: 'blk' }, [el('h2', { text: 'Отчёт' }), pre, el('div', { class: 'row' }, [copy, note])]);
  }
  /* после загрузки: какие именно строки не легли (не найдено / пропущено) — со ссылками на Weblate */
  function explainAll(list, into) {
    if (!list.length) return;
    var box = el('div', { class: 'blk' }, [el('h2', { text: 'Какие строки не легли' }), el('p', { class: 'muted', text: 'Сверяю файлы со строками в Weblate…' })]);
    (into || upResults).appendChild(box);
    var groups = [];
    pool(list, 3, function (u) {
      return explainUpload(u).then(function (items) { if (items.length) groups.push({ u: u, items: items }); }, function (e) {
        groups.push({ u: u, items: [{ label: '—', why: 'не получилось сверить: ' + e.message }] });
      });
    }).then(function () {
      box.textContent = '';
      box.appendChild(el('h2', { text: 'Какие строки не легли' }));
      if (!groups.length) { box.appendChild(el('p', { class: 'muted', text: 'Всё, что не принято, уже было в Weblate с таким же переводом — смотреть нечего.' })); return; }
      var txt = [];
      groups.sort(function (a, b) { return (a.u.c + a.u.lang).localeCompare(b.u.c + b.u.lang); }).forEach(function (g) {
        var head = g.u.c + ' · ' + langName(g.u.lang) + (/\.json$/i.test(g.u.name) ? ' (json)' : '');
        txt.push(head + ':');
        var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Строка' }), el('th', { text: 'Почему' })])]);
        g.items.forEach(function (it) {
          txt.push('  ' + it.label + ' — ' + it.why);
          t.appendChild(el('tr', {}, [el('td', {}, [it.href ? el('a', { href: it.href, target: '_blank', text: it.label }) : el('span', { text: it.label })]), el('td', { class: 'muted', text: it.why })]));
        });
        box.appendChild(el('details', { open: '' }, [el('summary', { text: head + ' — строк: ' + g.items.length }), t]));
      });
      var text = 'Не легли в Weblate:\n' + txt.join('\n'), note = el('span', { class: 'muted' });
      box.appendChild(el('div', { class: 'row' }, [el('button', { class: 'b g s', text: '📋 Скопировать список', onclick: function () {
        var done = function () { note.textContent = 'Скопировано ✓'; };
        var fb = function () { var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
      } }), note]));
    });
  }
  function runUpload(only, hooks) {
    hooks = hooks || {};
    var todo = uploads.filter(function (u) { return !u.error && !u.skip && !u.sent && (typeof only !== 'function' || only(u)); });
    if (!todo.length && hooks.done) { hooks.done([], null, ''); return; }
    if (!todo.length) {
      var sentAll = uploads.length && uploads.every(function (u) { return u.sent || u.error || u.skip; }) && uploads.some(function (u) { return u.sent; });
      upResults.textContent = sentAll ? '✓ Всё из списка уже загружено — повторно загружать не нужно. Можно нажать «Очистить список».'
        : 'Нечего загружать: добавь файлы или посмотри причины в колонке «Статус»';
      return;
    }
    var opts = { method: optMethod.value, fuzzy: optFuzzy.value, conflicts: optConf.value };
    /* машинный перевод из Smartcat — всегда «добавить как перевод» + «только непереведённые строки»;
       выбор в «3. Как загружать» — для файлов подрядчиков, его и запоминаем */
    /* машинный перевод Smartcat приходит как «требует правки» — импортируем как переведённое, как при ручной загрузке */
    var SC_OPTS = { method: 'translate', fuzzy: 'approve', conflicts: '' };
    if (todo.some(function (u) { return !u.fromSc; })) { sset('wlx_m', opts.method); sset('wlx_f', opts.fuzzy); sset('wlx_c', opts.conflicts); }
    upBtn.disabled = true;
    var ok = 0, bad = 0, t0 = Date.now();
    function secs(from) { var s = Math.round((Date.now() - from) / 1000); return s < 60 ? s + ' с' : Math.floor(s / 60) + ' мин ' + (s % 60) + ' с'; }
    /* Weblate обрабатывает файлы одного компонента по очереди, поэтому показываем, что процесс идёт */
    function progress() {
      upResults.textContent = 'Загружаю: готово ' + (ok + bad) + ' из ' + todo.length + ' · ' + secs(t0) +
        '. Weblate обрабатывает файлы одного компонента по очереди — не закрывай окно, пока всё не станет «✓ принято».';
      if (hooks.tick) hooks.tick(ok, bad, todo.length, secs(t0));
    }
    todo.forEach(function (u) { setRow(u, 'muted', 'в очереди'); });
    progress();
    var tick = setInterval(progress, 1000);
    csrfToken().then(function (token) {
      return pool(todo, 3, function (u) {
        var started = Date.now();
        setRow(u, 'muted', 'загружаю…');
        var rowTimer = setInterval(function () { if (!u.sent) setRow(u, 'muted', 'загружаю… ' + secs(started)); }, 1000);
        var o = u.opts || (u.fromSc ? SC_OPTS : opts);
        /* «переведённые и одобренные» без включённой проверки Weblate не принимает — тогда «переведённые» */
        u.usedOpts = o;
        var sendU = u; u.varSkipped = 0;
        if (varSkip.checked && varScan(u)) {
          var hardV = u.vars.filter(function (x) { return x.hard; });
          if (hardV.length) {
            var badIdx = hardV.map(function (x) { return x.idx; }), newText;
            if (/\.json$/i.test(u.name)) {
              /* плюралку не грузим наполовину: плохая одна форма — пропускаем все формы ключа */
              var jo = JSON.parse(u.text), keep = {}, plBase = function (k) { return k.replace(/_(zero|one|two|few|many|other|plural|\d+)$/, ''); };
              var badBase = badIdx.map(plBase);
              Object.keys(jo).forEach(function (k) { if (badBase.indexOf(plBase(k)) < 0) keep[k] = jo[k]; });
              newText = JSON.stringify(keep, null, 2) + '\n';
            } else newText = dropEntries(u.text, badIdx);
            sendU = Object.assign({}, u, { text: newText }); u.varSkipped = hardV.length;
          }
        }
        return uploadPo(sendU, o, token).catch(function (e) {
          if (o.conflicts !== 'replace-approved' || !/Проверка перевода не включена|review/i.test(String(e.message || e))) throw e;
          u.fellBack = true;
          u.usedOpts = Object.assign({}, o, { conflicts: 'replace-translated' });
          return uploadPo(sendU, u.usedOpts, token);
        }).then(function (r) {
          clearInterval(rowTimer);
          u.sent = true; ok++;
          u.accepted = r.accepted; u.upTotal = r.total; u.upSkipped = r.skipped || 0; u.notFound = r.not_found || 0;
          setRow(u, 'ok', r.viaForm ? '✓ отправлено (проверь в Weblate)'
            : '✓ принято ' + (r.accepted != null ? r.accepted : '?') + ' из ' + (r.total != null ? r.total : '?') +
              (r.skipped ? ', пропущено ' + r.skipped : '') + (r.not_found ? ', не найдено ' + r.not_found : '') +
              (r.skipped || r.not_found ? ' (какие — ниже)' : '') +
              (u.fellBack ? ' · в компоненте выключена проверка — залито с «Изменять переведённые строки»' : '') +
              (u.varSkipped ? ' · не загружено из-за переменных: ' + u.varSkipped : ''));
        }).catch(function (e) {
          clearInterval(rowTimer);
          bad++;
          u.upError = friendly(e).split('\n')[0];
          setRow(u, 'red', u.upError);
          u.row.title = String(e.message || e);
        });
      });
    }).then(function () {
      clearInterval(tick);
      upResults.textContent = 'Готово: загружено ' + ok + (bad ? ', с ошибкой ' + bad + ' (наведи на ошибку, чтобы увидеть подробности)' : '') + ' · ' + secs(t0);
      markScUploaded(todo);
      markScDone(todo);
      upResults.appendChild(uploadReport(todo, opts, secs(t0)));
      explainAll(todo.filter(function (u) { return u.sent && (u.upSkipped || u.notFound); }));
      if (hooks.done) hooks.done(todo, opts, secs(t0));
    }).catch(function (e) {
      clearInterval(tick);
      upResults.textContent = friendly(e);
      if (hooks.fail) hooks.fail(e);
    }).then(function () { upBtn.disabled = false; });
  }

  document.body.appendChild(host);
  window.__wlExport = { show: show, autoSend: autoSend, openTab: function (t) {
    show(); tab(t);
    if (HAS_EXT) syncScProjects().then(function () { return scCall('sc-ready-get'); }).then(function (r) { scReady = r || {}; renderScImport(); }, function () {});
  } };
})();
