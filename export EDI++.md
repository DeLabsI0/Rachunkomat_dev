**Komunikacja \- Struktura danych EDI++** 

**(wersja formatu 1.05 z grupami i cechami, pod format 1.05.1 dla biura z zaliczkami,  rozszerzone kartoteki osób, faktury wewnętrzne i** 

**ich korekty dla biura, nowe transakcje VAT, pod format 1.05.3 dla biura z fakturami VAT marża)** 

Autor: Jarosław Kolasa 

Modyfikacje: Paweł Halama 

**1\. Struktura danych EDI++ (wersja formatu 1.05, 1.05.1 lub 1.05.3)** 

# ***1.1. Sekcje i plik komunikacji*** 

Dane zawarte w pliku komunikacji zapisane są sekwencyjnie, sekcjami. Sekcja rozpoczyna się etykietą określającą rodzaj sekcji i zawartych w niej danych. Sekcja kończy się kolejną etykietą lub końcem pliku. Etykieta ma postać słowa kluczowego zawartego pomiędzy znakami \[ i \], bez znaków rozdzielających.  Generalnie wszystkie rodzaje przesyłanych danych można podzielić na dwie części: nagłówek i zawartość. Nasuwa się tu przykład dokumentu obrotowego, w nagłówku którego przechowuje np. datę i miejsce wystawienia, dane kontrahenta itp. natomiast  jego zawartość stanowią pozycje: identyfikator towaru, jego ilość, cena itd. Dlatego też zdefiniowano następujące trzy etykiety, oznaczające początek określonych sekcji. 

**Tabela 1 Etykiety występujące w plikach EDI++ oraz zawartość oznaczonych nimi sekcji.** 

| \[NAGLOWEK\]  | Tak oznaczona sekcja przenosi informacje stanowiące nagłówek danych zawartych w następującej po niej sekcji oznaczonej etykietą \[ZAWARTOSC\]. Sekcja taka może występować w dowolnym miejscu pliku komunikacji. Występuje zawsze, niezależnie od rodzaju przesyłanych danych.  |
| :---- | :---- |
| \[ZAWARTOSC\]  | Tak oznaczona sekcja przenosi informacje o zawartości dokumentu. Sekcja ta nie może występować samodzielnie, nie poprzedzona bezpośrednio sekcją \[NAGLOWEK\]. Natomiast przy pewnych typach danych sekcja ta może nie występować w ogóle (np. dokumenty kasowe i bankowe).  |
| \[INFO\]  | Tak oznaczona sekcja również przenosi informacje stanowiące nagłówek danych, ale dla całego pliku. Została wydzielona osobną etykietą, ponieważ dane te mają wpływ na sposób przekazu wszystkich danych zawartych w pliku komunikacji. Wyjątkowo, sekcja ta musi być pierwszą sekcją pliku komunikacji EDI++. Występuje zawsze, w każdym pliku komunikacji EDI++.  |

 

Strukturę pliku komunikacji EDI++ oraz sposób jego zapisu i odczytu można zobrazować następująco: 

Każda etykieta powinna znajdować się w osobnej linii i na jej początku. Dane z oznaczonej w ten sposób części sekcji muszą zaczynać się dopiero w kolejnej linii. Na końcu pliku wymiany musi się znajdować pusta linia. 

Dane w każdej z części powinny być zapisane w następujący sposób: 

* każdy rekord w osobnej linii, 

* kolejne pola rozdzielone przecinkami. 

Ze względu na rodzaj, dane przesyłane za pomocą EDI++ zostały podzielone na następujące grupy i podgrupy: 

 dane o dokumentach: 

 dokumenty obrotowe i magazynowe;  korekty;  kasowe i bankowe; 

 	 kasowe;  	 bankowe;   
 dane kartotekowe: 

 kontrahenci;  grupy kontrahentów;  cechy kontrahentów;  towary;  cennik towarów;  grupy towarów;  cechy towarów;  pracownicy;  urzędy skarbowe\*. 

\*Dane z kartoteki pracowników i urzędów skarbowych służą do przesyłania danych skojarzonych z przesyłanymi dokumentami. Nie mogą być wykorzystywane do samodzielnego przenoszenia informacji z tych kartotek. 

# ***1.2. Nagłówek pliku komunikacji*** 

Plik komunikacji EDI++ rozpoczyna zawsze specjalna sekcja, oznaczona wyjątkowo etykietą \[INFO\]. Zawiera ona jakby nagłówek całości przesyłanych informacji. 

**Tabela 2 Struktura danych nagłówka pliku komunikacji EDI++.** 

| L.p. Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| *Podstawowe informacje*  |  |  |
| 1\.   | Wersja formatu pliku EDI++ (“1.05” lub pod format “1.05.1” lub pod format “1.05.3”)  | Tekst (50)  |
| 2\.   | Cel komunikacji  \- biuro rachunkowe;  \- akwizytor;  \- centrala;  | Bajt  |
| **L.p. Opis**  |  | **Typ danych**  |
|  |  3 	\- inny cel  |  |
| 3\.   | Strona kodowa zapisu    852 \- Latin 2   1250 \- Windows (polska strona kodowa)  | Liczba całkowita  |
| 4\.   | Informacja o programie (np. nazwa programu tworzącego plik komunikacji)  | Tekst (255)  |
| 5\.   | Kod identyfikacyjny nadawcy pliku komunikacji (np. w *Pakiecie* jest to kod z Administracji)  | Tekst (20)  |
| *Nadawca*  |  |  |
| 6\.   | Nazwa skrócona nadawcy  | Tekst (40)  |
| 7\.   | Nazwa długa nadawcy  | Tekst (80)  |
| 8\.   | Miasto nadawcy  | Tekst (30)  |
| 9\.   | Kod pocztowy nadawcy  | Tekst (6)  |
| 10\.   | Ulica i nr nadawcy (adres)  | Tekst (50)  |
| 11\.   | NIP nadawcy  | Tekst (13)  |
| *Magazyn*  |  |  |
| 12\.   | Kod magazynu, z którego pochodzą zapisane informacje  | Tekst (20)  |
| 13\.   | Nazwa magazynu  | Tekst (40)  |
| 14\.   | Opis magazynu  | Tekst (255)  |
| 15\.   | Analityka magazynu  | Tekst (5)  |
| *Inne informacje dotyczące komunikacji*  |  |  |
| 16\.   | Dane z okresu (następujące daty są istotne)  | Logiczne  |
| 17\.   | Początek okresu, z którego pochodzą dane  | Data  |
| 18\.   | Koniec okresu, z którego pochodzą dane  | Data  |
| 19\.   | Kto wykonał komunikację  | Tekst (35)  |
| 20\.   | Kiedy została wykonana komunikacja  | Data  |
| 21\.   | Państwo  | Tekst (50)  |
| 22\.   | Prefiks państwa UE  | Tekst (2)  |
| 23\.   | NIP unijny nadawcy  | Tekst (20)  |
| 24\.   | Czy nadawca jest unijny  | Logiczne  |

 

# ***1.3. Sekcje przechowujące dane o dokumentach*** 

Dane przenoszone w nagłówkach dokumentów są danymi charakterystycznymi dla danego dokumentu i mogą się różnić od danych aktualnych. Przykład: kontrahent zmienił adres od czasu wystawienia danego dokumentu. Jego dane zostały uaktualnione w systemie. Jego adres w nagłówku dokumentu będzie różny od zawartego w dołączonej kartotece kontrahentów. Nagłówki dokumentów zawierają (tak jak w całym systemie) informacje aktualne w chwili wystawiania dokumentu. Dane w kartotece zawierają zawsze najbardziej aktualne informacje. 

 

## 1.3.1. Nagłówek dokumentów obrotowych i magazynowych 

Nagłówek wszystkich dokumentów obrotowych i magazynowych, łącznie z korektami, przesyłany jest w ten sam sposób, tzn. struktura nagłówka dla tych wszystkich dokumentów jest taka sama. Dzieje się tak bez względu na wybrany cel komunikacji. 

**Tabela 3 Nagłówek dokumentu obrotowego lub magazynowego.** 

| L.p. Opis  |  |  | Typ danych  |
| :---- | :---- | :---- | :---- |
| *Podstawowe parametry*  |  |  |  |
| 1\.   | Typ dokumentu   "FZ" 	\-  "FR" 	\-  "FS" 	\-  "RZ" 	\-  "RS"   "KFZ"  "KFS"   "KRZ"   "KRS"   "MMW"   "PZ"   "WZ"   "VPZ"   "VWZ"   "PW"   "RW"   "ZW"   "ZD"   "ZK"   "PA"   "FWN”     "FWO”      "KWN”     "KWO”      "FM”  |  faktura zakupu;  faktura zakupu RR;  faktura sprzedaży;  rachunek zakupu;  rachunek sprzedaży;  korekta faktury zakupu;  korekta faktury sprzedaży;  korekta rachunku zakupu;  korekta rachunku sprzedaży;  przesunięcie międzymagazynowe;  przyjęcie zewnętrzne;  wydanie zewnętrzne;  PZ z VAT;  WZ z VAT;  przychód wewnętrzny;  rozchód wewnętrzny;  zwrot ze sprz. detal.;  zamówienie do dostawcy;  zamówienie od klienta;  paragon;  faktura wewnętrzna podatku należnego (tylko dla   biura);  faktura wewnętrzna podatku naliczonego (tylko dla  biura);  korekta fakt. wewn. podatku należnego (tylko dla   biura);  korekta fakt. wewn. podatku naliczonego (tylko dla  biura);  faktura VAT marża (tylko dla biura);  | Tekst (3)  |
| 2\.   | Status dokumentu  \- odłożony;  \- wykonany;  \- anulowany;  \- zaksięgowany  |  | Bajt  |
| 3\.   | Status rejestracji fiskalnej dokumentu (flaga)   0x00 \- nie zarejestrowany;   0x01 \- zarejestrowany raz;   0x02 \- zarejestrowany wielokrotnie (więcej niż raz);  0x80 \- podczas rejestracji wystąpił błąd  |  | Bajt  |
| 4\.   | Numer dokumentu  |  | Liczba długa  |
| 5\.   | Numer dokumentu dostawcy  |  | Tekst (20)  |
| 6\.   | Rozszerzenie numeru wpisane przez użytkownika  |  | Tekst (10)  |
| 7\.   | Pełny numer dokumentu (pierwsze maks. cztery znaki to mnemonik typu dokumentu i spacja)  |  | Tekst (30)  |
| 8\.   | Numer dokumentu korygowanego  |  | Tekst (30)  |
| 9\.   | Data wystawienia dokumentu korygowanego  |  | Data  |

| L.p. Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| 10\.   | Numer zamówienia  | Tekst (30)  |
| 11\.   | Magazyn docelowy dla MM (symbol)  | Tekst (3)  |
| *Kontrahent*  |  |  |
| 12\.   | Kod identyfikacyjny kontrahenta  | Tekst (20)  |
| 13\.   | Nazwa skrócona kontrahenta  | Tekst (40)  |
| 14\.   | Nazwa pełna kontrahenta  | Tekst (255)  |
| 15\.   | Miasto kontrahenta  | Tekst (30)  |
| 16\.   | Kod pocztowy kontrahenta  | Tekst (6)  |
| 17\.   | Ulica i numer kontrahenta (adres)  | Tekst (50)  |
| 18\.   | NIP kontrahenta (unijny lub krajowy)  | Tekst (20)  |
| *Kategoria dokumentu*  |  |  |
| 19\.   | Kategoria (nazwa)  | Tekst (30)  |
| 20\.   | Podtytuł kategorii  | Tekst (50)  |
| *Miejsce i data*  |  |  |
| 21\.   | Miejsce wystawienia  | Tekst (30)  |
| 22\.   | Data wystawienia  | Data  |
| 23\.   | Data sprzedaży  | Data  |
| 24\.   | Data otrzymania  | Data  |
| *Pozycje*  |  |  |
| 25\.   | Liczba pozycji  | Liczba długa  |
| *Cena na dokumencie*  |  |  |
| 26\.   | Czy dokument wystawiany wg cen netto  | Logiczne  |
| 27\.   | Aktywna cena (nazwa)  | Tekst (20)  |
| *Wartość i koszt dokumentu*  |  |  |
| 28\.   | Wartość netto  | Kwota  |
| 29\.   | Wartość VAT  | Kwota  |
| 30\.   | Wartość brutto  | Kwota  |
| 31\.   | Koszt  | Kwota  |
| *Rabat i forma płatności*  |  |  |
| 32\.   | Rabat (nazwa)  | Tekst (30)  |
| 33\.   | Rabat (procent)  | Kwota  |
| 34\.   | Forma płatności (nazwa)  | Tekst (30)  |
| 35\.   | Termin płatności  | Data  |
| *Kwoty na dokumencie*  |  |  |
| 36\.   | Kwota zapłacona przy odbiorze dokumentu  | Kwota  |
| 37\.   | Wartość do zapłaty  | Kwota  |
| *Zaokrąglenia i przeliczanie*  |  |  |
| 38\.   | Zaokrąglenie wartości do zapłaty  \- do 1 grosza;  \- do 10 groszy;  \- do 1 złotego  | Bajt  |
| 39\.   | Zaokrąglenie wartości VAT  \- do 1 grosza;  \- do 10 groszy;  \- do 1 złotego  | Bajt  |
| 40\.   | Automatycznie przeliczana tabela VAT i wartość dokumentu  | Logiczne  |
| 41\.   | Statusy rozszerzone i specjalne dokumentów 0 \- nie używany;  | Bajt  |

| L.p. Opis  |  | Typ danych  |
| :---- | :---- | :---- |
|  | \- faktura zaliczkowa pośrednia zwykła;  \- faktura zaliczkowa końcowa zwykła;  \- faktura zakupu płatność automatyczna;  \- faktura zakupu płatność dowolna;  do 36 	\- zamówienia zwykłe;  \- faktura zaliczkowa pośrednia nowa;  \- korekta faktury zaliczkowej pośredniej nowej;  \- faktura zaliczkowa końcowa nowa;  do 71 	\- zamówienia zaliczkowe nowe;  72 \- faktura wewnętrzna do nieistniejącego  |  |
| *Osoby związane z dokumentem*  |  |  |
| 42\.   | Nazwisko i imię osoby wystawiającej  dokument  | Tekst (35)  |
| 43\.   | Nazwisko i imię osoby odbierającej dokument  | Tekst (35)  |
| 44\.   | Podstawa wydania dokumentu  | Tekst (35)  |
| *Opakowania*  |  |  |
| 45\.   | Wartość wydanych opakowań  | Kwota  |
| 46\.   | Wartość zwróconych opakowań  | Kwota  |
| *Waluta dokumentu*  |  |  |
| 47\.   | Waluta (symbol)  | Tekst (3)  |
| 48\.   | Kurs waluty  | Kwota  |
| *Inne parametry*  |  |  |
| 49\.   | Uwagi  | Tekst (255)  |
| 50\.   | Komentarz  | Tekst (50)  |
| 51\.   | Podtytuł dokumentu  | Tekst (50)  |
| 52\.   | Nie używane  | Tekst (50)  |
| 53\.   | Przeprowadzony import dokumentu (flaga)   0x00 \- nie przeprowadzony   0x01 \- zaimportowany do księgi   0x02 \- zaimportowany do ewid. VAT  | Bajt  |
| 54\.   | Dokument eksportowy  | Logiczne  |
| 55\.   | Rodzaj transakcji  – krajowa (S/Z)  – import/eksport (EX/IM)  – wewnątrzunijna (WDT/WNT)  – trójstronna (WTTD/WTTN)  – import/eksport usług (EXU/IMU)  6   – odwrotne obciążenie (OOs/OOz)  – nabycie wewnątrzwspólnotowe (WNTn)  – import usług (IMUn)  – nabycie/dostawa poza terytorium kraju (SPTK)  | Bajt  |
| *Płatności kartą i kredytowe*  |  |  |
| 56\.   | Płatność kartą (nazwa)  | Tekst (50)  |
| 57\.   | Płatność kartą (kwota)  | Kwota  |
| 58\.   | Płatność kredytowa (nazwa)  | Tekst (50)  |
| 59\.   | Płatność kredytowa (kwota)  | Kwota  |
| *Inne dane*  |  |  |
| 60\.   | Państwo kontrahenta  | Tekst (50)  |
| 61\.   | Prefiks państwa UE kontrahenta  | Tekst (2)  |
| 62\.   | Czy kontrahent jest unijny  | Logiczne  |

 

## 1.3.2. Zawartość dokumentów obrotowych i magazynowych 

Podobnie jak nagłówek, zawartość dokumentów obrotowych i magazynowych, przesyłana jest w ten sam sposób. Istnieje jednak rozróżnienie ze względu na cel komunikacji, czy dane wysyłane są do biura rachunkowego, czy też do systemu sprzedaży lub magazynowego. W pierwszym przypadku (komunikacja typu Subiekt-Rewizor) , zawartość tych dokumentów to tabela wartości VAT w rozbiciu na stawki. Oczywiście dokumenty magazynowe, nie posiadające tabeli VAT mają w tym przypadku pustą zawartość (brak jakichkolwiek rekordów). Natomiast w drugim przypadku (komunikacja typu Subiekt-Subiekt) są to pozycje dokumentu. I tutaj, jeśli chodzi o strukturę danych,  wyjątek stanowią korekty. Są one specyficznymi dokumentami i wymagają dodatkowych informacji, które są przesyłane na  dodatkowych polach zwiększających długość rekordu pozycji. 

**Tabela 4 Zawartość dokumentu obrotowego dla komunikacji do biura rachunkowego (Rachmistrz, Rewizor).** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| *Stawka podatku VAT*  |  |  |
| 1\.   | Symbol stawki podatku VAT  | Tekst (6)  |
| 2\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| *Wartości*  |  |  |
| 3\.   | Wartość netto  | Kwota  |
| 4\.   | Wartość VAT  | Kwota  |
| 5\.   | Wartość brutto  | Kwota  |

Niżej wymieniona struktura \[Tabela 4A\] zastępuje powyższą \[Tabela 4\] w wypadku wyboru formatu EDI++ (do biura z zaliczkami) (pod format pliku 1.05.1). Wartości ogólne netto, VAT i brutto dla wszystkich dokumentów poza nowymi fakturami zaliczkowymi końcowymi są równe wartościom netto, VAT i brutto odpowiednio. Pozostałe dodatkowe dane podają opisane wartości tylko dla nowych faktur zaliczkowych końcowych a dla pozostałych dokumentów zawierają wartość zero. 

**Tabela 5A Zawartość dokumentu obrotowego dla komunikacji do biura rachunkowego z zaliczkami pod format 1.05.1 (Rachmistrz, Rewizor).** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| *Stawka podatku VAT*  |  |  |
| 1\.   | Symbol stawki podatku VAT  | Tekst (6)  |
| 2\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| *Wartości*  |  |  |
| 3\.   | Wartość netto  | Kwota  |
| 4\.   | Wartość VAT  | Kwota  |
| 5\.   | Wartość brutto  | Kwota  |
| 6\.   | Wartość netto ogólna końcowa  | Kwota  |
| 7\.   | Wartość VAT ogólna końcowa  | Kwota  |
| 8\.   | Wartość brutto ogólna końcowa  | Kwota  |
| 9\.   | Wartość netto przednich zaliczek  | Kwota  |
| 10\.   | Wartość VAT poprzednich zaliczek  | Kwota  |
| 11\.   | Wartość brutto poprzednich zaliczek  | Kwota  |
| 12\.   | Wartość netto w PLN poprzednich zaliczek  | Kwota  |
| 13\.   | Wartość VAT w PLN poprzednich zaliczek  | Kwota  |
| **Lp**  | **Opis**  | **Typ danych**  |
| 14\.   | Wartość brutto w PLN poprzednich zaliczek  | Kwota  |

 

Niżej wymieniona struktura \[Tabela 4B\] zastępuje tabelę \[Tabela 4\] w wypadku wyboru formatu EDI++ (do biura z fakturami marża) (pod format pliku 1.05.3). Wartości ogólne netto, VAT i brutto dla wszystkich dokumentów poza nowymi fakturami zaliczkowymi końcowymi i fakturami VAT marża są równe wartościom netto, VAT i brutto odpowiednio. Następne dodatkowe dane podają opisane wartości tylko dla nowych faktur zaliczkowych końcowych. Dla faktur VAT marża pola zawierają informacje o marży (netto, VAT i brutto) oraz wartość nabycia. Dla pozostałych dokumentów wszystkie dodatkowe pola zawierają wartość zero. 

**Tabela 6B Zawartość dokumentu obrotowego dla komunikacji do biura rachunkowego z fakturami VAT marża pod format 1.05.3 (Rachmistrz, Rewizor).** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| *Stawka podatku VAT*  |  |  |
| 1\.   | Symbol stawki podatku VAT  | Tekst (6)  |
| 2\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| *Wartości*  |  |  |
| 3\.   | Wartość netto  | Kwota  |
| 4\.   | Wartość VAT  | Kwota  |
| 5\.   | Wartość brutto  | Kwota  |
| 6\.   | Wartość netto ogólna końcowa  | Kwota  |
| 7\.   | Wartość VAT ogólna końcowa  | Kwota  |
| 8\.   | Wartość brutto ogólna końcowa  | Kwota  |
| 9\.   | Wartość netto przednich zaliczek  | Kwota  |
| 10\.   | Wartość VAT poprzednich zaliczek  | Kwota  |
| 11\.   | Wartość brutto poprzednich zaliczek  | Kwota  |
| 12\.   | Wartość netto w PLN poprzednich zaliczek  | Kwota  |
| 13\.   | Wartość VAT w PLN poprzednich zaliczek  | Kwota  |
| 14\.   | Wartość brutto w PLN poprzednich zaliczek  | Kwota  |
| 15\.   | Wartość netto marży  | Kwota  |
| 16\.   | Wartość VAT marży  | Kwota  |
| 17\.   | Wartość brutto marży  | Kwota  |
| 18\.   | Wartość nabycia  | Kwota  |

 

**Tabela 7 Zawartość dokumentu obrotowego lub magazynowego dla komunikacji typu Subiekt-Subiekt (pozycje).** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Liczba porządkowa (numer pozycji)  | Liczba długa  |
| *Towar*  |  |  |
| 2\.   | Typ towaru  \- towar  \- usługa   4 \- opakowanie   8 \- komplet  | Bajt  |
| 3\.   | Kod identyfikacyjny towaru  | Tekst (20)  |
| **Lp 	Opis**  |  | **Typ danych**  |
| *Rabat*  |  |  |
| 4\.   | Rabat procentowy   Prawda \- procentowy   Fałsz 	\- wartościowy  | Logiczne  |
| 5\.   | Rabat od ceny   Prawda \- od ceny   Fałsz 	\- od wartości  | Logiczne  |
| 6\.   | Rabat na pozycji kumulowany z rabatem od całego dokumentu  | Logiczne  |
| 7\.   | Rabat zablokowany dla tej pozycji  | Logiczne  |
| 8\.   | Wartość udzielonego na pozycji rabatu  | Kwota  |
| 9\.   | Wysokość rabatu udzielonego na pozycji w procentach  | Kwota  |
| *Ilość i jednostka miary*  |  |  |
| 10\.   | Jednostka miary  | Tekst (10)  |
| 11\.   | Ilość towaru w jednostce miary  | Kwota  |
| 12\.   | Ilość towaru w jednostce magazynowej  | Kwota  |
| *Ceny*  |  |  |
| 13\.   | Cena magazynowa towaru  | Kwota  |
| 14\.   | Cena netto towaru  | Kwota  |
| 15\.   | Cena brutto towaru  | Kwota  |
| *VAT, wartość i koszt*  |  |  |
| 16\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| 17\.   | Wartość netto pozycji  | Kwota  |
| 18\.   | Wartość VAT  | Kwota  |
| 19\.   | Wartość brutto  | Kwota  |
| 20\.   | Koszt pozycji  | Kwota  |
| *Usługa jednorazowa*  |  |  |
| 21\.   | Opis usługi jednorazowej  | Tekst (250)  |
| 22\.   | Nazwa usługi jednorazowej  | Tekst (50)  |

 

Dodatkowe pola występujące w przypadku przesyłania pozycji dokumentów korygujących przechowują informacje o wartościach na pozycji zanim ta została skorygowana. 

**Tabela 8 Dodatkowe pola pozycji, występujące tylko w przypadku dokumentów korygujących.** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Cena towaru netto lub brutto (zależy od sposobu liczenia dokumentu)   | Kwota  |
| 2\.   | Cena towaru brutto lub netto (zależy od sposobu liczenia dokumentu)  | Kwota  |
| 3\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| 4\.   | Ilość towaru w jednostce miary  | Kwota  |
| 5\.   | Jednostka miary  | Tekst (10)  |
| 6\.   | Rabat procentowy lub wartościowy (zależy od typu udzielonego rabatu na pozycji)  | Kwota  |
| 7\.   | Wartość netto  | Kwota  |
| 8\.   | Wartość VAT  | Kwota  |
| 9\.   | Wartość brutto  | Kwota  |

 

## 1.3.3. Nagłówek dokumentów kasowego i bankowego 

Oba typy dokumentów, kasowe i bankowe, przenoszą w większości identyczne informacje. Struktura przesyłanych danych jest więc tak dobrana, że w swojej głównej części jest identyczna dla obu tych typów dokumentów. Różnice zachodzą jedynie na kilku ostatnich polach. Ani dokumenty kasowe, ani bankowe nie posiadają zawartości w sensie komunikacji. Ich przesyłane dane składają się z pojedynczej sekcji. 

**Tabela 9 Część nagłówka dokumentu kasowego lub bankowego wspólna dla obu tych typów dokumentu.** 

| Lp 	Opis  |  | Typ danych  |
| :---- | :---- | :---- |
| *Parametry podstawowe*  |  |  |
| 1\.   | Typ dokumentu   "KP" 	\- kasa przyjmie;   "KW" 	\- kasa wyda;   "BP" 	\- bank przyjmie;   "BW" 	\- bank wyda  | Tekst (3)  |
| 2\.   | Status dokumentu  \- odłożony;  \- wykonany  | Bajt  |
| 3\.   | Numer dokumentu  | Liczba długa  |
| 4\.   | Pełny numer dokumentu (pierwsze trzy znaki to mnemonik typu dokumentu i spacja)  | Tekst (30)  |
| 5\.   | Data wystawienia  | Data  |
| *Identyfikacja odbiorcy dokumentu*  |  |  |
| 6\.   | Typ odbiorcy dokumentu  \- kontrahent;  \- pracownik;  \- urząd;  \- kontrahent jednorazowy  | Bajt  |
| 7\.   | Kod identyfikacyjny kontrahenta lub PESEL pracownika lub nazwa urzędu skarbowego (może być puste, jeśli dokument wystawiony dla kontrahenta jednorazowego)  | Tekst (50)  |
| *Kontrahent*  |  |  |
| 8\.   | Nazwa skrócona kontrahenta  | Tekst (40)  |
| 9\.   | Nazwa pełna kontrahenta  | Tekst (80)  |
| 10\.   | Miasto kontrahenta  | Tekst (30)  |
| 11\.   | Kod pocztowy kontrahenta  | Tekst (60)  |
| 12\.   | Ulica i numer kontrahenta (adres)  | Tekst (50)  |
| 13\.   | NIP kontrahenta   | Tekst (20)  |
| *Pracownik*  |  |  |
| 14\.   | Nazwisko pracownika  | Tekst (30)  |
| 15\.   | Pierwsze imię pracownika  | Tekst (20)  |
| 16\.   | Drugie imię pracownika  | Tekst(20)  |
| 17\.   | Imię matki pracownika  | Tekst (20)  |
| 18\.   | Imię ojca pracownika  | Tekst (20)  |
| 19\.   | Data urodzin pracownika  | Data  |
| 20\.   | Miejsce urodzin pracownika  | Tekst (30)  |

| 	Lp 	Opis  |  |  |  | Typ danych  |  |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 21\.   | NIP pracownika  |  |  | Tekst (13)  |  |
| 22\.   | Ulica pracownika  |  |  | Tekst (50)  |  |
| 23\.   | Numer domu pracownika  |  |  | Tekst (5)  |  |
| 24\.   | Numer lokalu pracownika  |  |  | Tekst (5)  |  |
| 25\.   | Kod pocztowy pracownika  |  |  | Tekst (6)  |  |
| 26\.   | Miasto pracownika  |  |  | Tekst (30)  |  |
| 27\.   | Gmina pracownika  |  |  | Tekst (30)  |  |
| 28\.   | Województwo pracownika  |  |  | Tekst (30)  |  |
| 29\.   | Państwo pracownika  |  |  | Tekst (50)  |  |
| *Urząd*  |  |  |  |  |  |
| 30\.   | Ulica urzędu  |  |  | Tekst (50)  |  |
| 31\.   | Numer domu urzędu  |  |  | Tekst (5)  |  |
| 32\.   | Miasto urzędu  |  |  | Tekst (30)  |  |
| 33\.   | Kod pocztowy urzędu  |  |  | Tekst (6)  |  |
| 34\.   | Poczta urzędu  |  |  | Tekst (30)  |  |
| *Kategoria*  |  |  |  |  |  |
| 35\.   | Kategoria (nazwa)  |  |  | Tekst (30)  |  |
| 36\.   | Podtytuł kategorii  |  |  | Tekst (50)  |  |
| *Inne parametry*  |  |  |  |  |  |
| 37\.   | Opis za co został wykonany dokument (dla automatycznie wygenerowanych – pełny numer dokumentu obrotowego lub magazynowego, dla którego został wygenerowany)  |  |  | Tekst (255)  |  |
| 38\.   | Dokument wystawiony automatycznie (wygenerowany)  |  |  | Logiczne  |  |
| 39\.   | Data wystawienia dokumentu, do którego został wygenerowany przesyłany dokument  |  |  | Data  |  |
| 40\.   | Komentarz  |  |  | Tekst (255)  |  |
| 41\.   | Uwagi  |  |  | Tekst (255)  |  |
| *Wartość*  |  |  |  |  |  |
| 42\.   | Kwota wykorzystana jako spłata (początkowo zero)  |  |  | Kwota  |  |
| 43\.   | Wartość dokumentu kasowego  |  |  | Kwota  |  |
| *Dekretacja*  |  |  |  |  |  |
| 44\.   | Dokument jest importowany wg dekretacji prostej  |  |  | Logiczne  |  |
| 45\.   | Numer konta Wn dla dekretacji prostej  |  |  | Tekst (15)  |  |
| 46\.   | Numer konta Ma dla dekretacji prostej  |  |  | Tekst (15)  |  |
| 47\.   | Rejestr dla dekretacji prostej  |  |  | Tekst (3)  |  |
| *Osoby związane z dokumentem*  |  |  |  |  |  |
| 48\.   | Nazwisko i imię osoby wystawiającej dokument  |  |  | Tekst (50)  |  |
| 49\.   | Nazwisko i imię osoby odbierającej dokument  |  |  | Tekst (50)  |  |
|  | *Dokument bankowy*  |  | *Dokument kasowy*  |  |  |
| 50\.  | Nazwa banku  | Tekst (50)  | Kod identyfikacyjny kasy  |  | Tekst (20)  |
| 51  | Numer rachunku  | Tekst (50)  | Nazwa kasy  |  | Tekst (80)  |
| 52  | Nazwa banku odbiorcy dok.  | Tekst (50)  | Analityka kasy  |  | Tekst (3)  |
| 53  | Nr rachunku odbiorcy dok.  | Tekst (50)  | Nieużywane  |  | Tekst(1)  |
| *Inne dane*  |  |  |  |  |  |
| 54  | Państwo kontrahenta  |  |  | Tekst (50)  |  |
| 55  | Prefiks państwa UE kontrahenta  |  |  | Tekst (2)  |  |
| 56  | Czy kontrahent występujący na dokumencie jest unijny  |  |  | Logiczne  |  |

# ***1.4. Sekcje przechowujące dane o elementach kartotek*** 

Dane zawarte w kartotekach przesyłanych komunikacją są to zawsze najbardziej aktualne dane dotyczące elementów tych kartotek. W przeciwieństwie do dokumentów, których nagłówki zawierają dane aktualne w chwili wystawiania dokumentu. Na podstawie danych z przesyłanych kartotek można (i tak się dzieje w *Komunikacji*) dodawać nowe elementy kartotek, a dane istniejących elementów aktualizować. 

Kolejność przesyłanych kartotek nie ma znaczenia, z wyjątkiem cennika przesyłanego za kartoteką towarów. 

Kartoteki przesyłane komunikacją nie wymagają żadnych informacji dotyczących całości przesyłanych danych. Dane kartotekowe zawsze znajdują się w sekcji oznaczonej etykietą \[ZAWARTOSC\]. Sekcja ta poprzedzona jest sekcją nagłówkową (etykieta \[NAGLOWEK\]), której zawartość ogranicza się jedynie do słowa kluczowego określającego rodzaj przesyłanych danych kartotekowych. Zdefiniowano następujące słowa kluczowe identyfikujące przesyłane odpowiednie dane kartotekowe: 

KONTRAHENCI 

GRUPYKONTRAHENTOW 

CECHYKONTRAHENTOW 

TOWARY 

CENNIK 

GRUPYTOWAROW 

CECHYTOWAROW 

PRACOWNICY 

URZEDY 

IDENTYFIKATORYPLATNOSCI – dostępne tylko w Navireo (pod format 1.05.2) 

 

## 1.4.1. Kartoteka kontrahentów, grupy i cechy 

**Tabela 10 Struktura przesyłanej kartoteki kontrahentów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Typ kontrahenta  \- odbiorca / dostawca;   \- dostawca;  \- odbiorca;  \- odbiorca detaliczny;  \- osoba, dostawca/odbiorca (nie będąca odbiorcą detalicznym);  \- osoba, dostawca (nie będąca odbiorcą detalicznym);  \- osoba, odbiorca (nie będąca odbiorcą detalicznym);  \- osoba, dostawca/odbiorca (będąca odbiorcą detalicznym);  \- osoba, dostawca (będąca odbiorcą detalicznym);  \- osoba, odbiorca (będąca odbiorcą detalicznym);  | Bajt  |
| 2\.   | Kod identyfikacyjny  | Tekst (40)  |
| **Lp**  | **Opis**  | **Typ danych**  |
| 3\.   | Nazwa skrócona  | Tekst (40)  |
| 4\.   | Nazwa pełna  | Tekst (80)  |
| 5\.   | Miasto  | Tekst (30)  |
| 6\.   | Kod pocztowy  | Tekst (6)  |
| 7\.   | Ulica i numer (adres)  | Tekst (50)  |
| 8\.   | NIP kontrahenta  | Tekst (20)  |
| 9\.   | REGON  | Tekst (20)  |
| 10\.   | Telefon  | Tekst (50)  |
| 11\.   | Faks  | Tekst (50)  |
| 12\.   | Teleks  | Tekst (50)  |
| 13\.   | Adres poczty elektronicznej (e-mail)  | Tekst (50)  |
| 14\.   | Adres stron WWW  | Tekst (50)  |
| 15\.   | Nazwisko i imię osoby kontaktowej  | Tekst (50)  |
| 16\.   | Analityka dostawcy  | Tekst (5)   |
| 17\.   | Analityka odbiorcy  | Tekst (5)   |
| 18\.   | Pole użytkownika 1  | Tekst (50)   |
| 19\.   | Pole użytkownika 2  | Tekst (50)   |
| 20\.   | Pole użytkownika 3  | Tekst (50)   |
| 21\.   | Pole użytkownika 4  | Tekst (50)   |
| 22\.   | Pole użytkownika 5  | Tekst (50)   |
| 23\.   | Pole użytkownika 6  | Tekst (50)   |
| 24\.   | Pole użytkownika 7  | Tekst (50)   |
| 25\.   | Pole użytkownika 8  | Tekst (50)   |
| 26\.   | Nazwa banku (z podstawowego rachunku bankowego kontrahenta)  | Tekst (50)  |
| 27\.   | Numer konta w banku (z podstawowego rachunku bankowego kontrahenta)  | Tekst (50)  |
| 28\.   | Państwo kontrahenta  | Tekst (50)  |
| 29\.   | Prefiks państwa UE kontrahenta  | Tekst (2)  |
| 30\.   | Czy kontrahent jest unijny   | Logiczne  |

 

**Tabela 11 Struktura przesyłanych grup kontrahentów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Kod identyfikacyjny kontrahenta  | Tekst (40)  |
| 2\.   | Nazwa grupy  | Tekst (50)  |

 

**Tabela 12 Struktura przesyłanych cech kontrahentów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Kod identyfikacyjny kontrahenta  | Tekst (40)  |
| 2\.   | Nazwa cechy  | Tekst (50)  |

 

## 1.4.2. Kartoteka towarów, cennik, grupy i cechy 

Przesyłana kartoteka towarów jest związana z cennikiem, grupami i cechami. Sam format EDI++ tego nie wymaga, jednak takie jest działanie *Komunikacji*. Cennik, grupy i cechy zawsze występują za kartoteką towarów. 

**Tabela 13 Struktura przesyłanej kartoteki towarów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Typ towaru  \- towar;  \- usługa;   4 \- opakowanie;   8 \- komplet  | Bajt  |
| 2\.   | Kod identyfikacyjny  | Tekst (20)  |
| 3\.   | Kod towaru u producenta / dostawcy  | Tekst (20)  |
| 4\.   | Kod paskowy  | Tekst (20)  |
| 5\.   | Nazwa  | Tekst (50)  |
| 6\.   | Opis  | Tekst (255)  |
| 7\.   | Nazwa towaru dla urządzeń fiskalnych  | Tekst (50)  |
| 8\.   | Symbol SWW lub KU  | Tekst (20)  |
| 9\.   | Symbol PKWiU  | Tekst (20)  |
| 10\.   | Podstawowa jednostka miary  | Tekst (10)  |
| 11\.   | Symbol stawki podatku VAT  | Tekst (6)  |
| 12\.   | Wysokość stawki podatku VAT w procentach  | Kwota  |
| 13\.   | Symbol stawki podatku VAT przy zakupie  | Tekst (6)  |
| 14\.   | Wysokość stawki podatku VAT przy zakupie w procentach  | Kwota  |
| 15\.   | Ostatnia cena zakupu netto (w PLN) \- dla podstawowej jednostki miary  | Kwota  |
| 16\.   | Cena zakupu walutowa  | Kwota  |
| 17\.   | Jednostka miary przy zakupie (do ceny walutowej)  | Tekst (10)  |
| 18\.   | Kurs waluty służący do kalkulacji ceny zakupu  | Bajt  |
| 19\.   | Symbol waluty  | Tekst (3)  |
| 20\.   | Kod opakowania związanego z towarem  | Tekst (20)  |
| 21\.   | Jednostka miary dla stanu minimalnego  | Tekst  |
| 22\.   | Stan minimalny (wybrana jednostka)  | Kwota  |
| 23\.   | Średni czas dostawy  | Liczba długa  |
| 24\.   | Kod identyfikacyjny producenta / dostawcy  | Tekst (20)  |
| 25\.   | Data ważności jako konkretny dzień  | Data  |
| 26\.   | Data ważności jako ilość dni od ostatniej dostawy  | Liczba całkowita  |
| 27\.   | Jednostka miary dla objętości  | Tekst (10)  |
| 28\.   | Objętość towaru (wybrana jednostka)  | Kwota  |
| 29\.   | Ilość roboczo-godzin w jednostce podstawowej usługi  | Kwota  |
| 30\.   | Rodzaj roboczo-godzin usługi  | Tekst (50)  |
| 31\.   | Cena otwarta  | Logiczne  |
| 32\.   | Uwagi  | Tekst (255)  |
| 33\.   | Podstawa kalkulacji cen  \- narzut;  \- marża;  \- zysk  | Bajt  |
| **Lp**  | **Opis**  | **Typ danych**  |
| 34\.   | Towar ważony na wadze etykietującej  | Logiczne  |
| 35\.   | Pole użytkownika 1  | Tekst (50)  |
| 36\.   | Pole użytkownika 2  | Tekst (50)  |
| 37\.   | Pole użytkownika 3  | Tekst (50)  |
| 38\.   | Pole użytkownika 4  | Tekst (50)  |
| 39\.   | Pole użytkownika 5  | Tekst (50)  |
| 40\.   | Pole użytkownika 6  | Tekst (50)  |
| 41\.   | Pole użytkownika 7  | Tekst (50)  |
| 42\.   | Pole użytkownika 8  | Tekst (50)  |

 

**Tabela 14 Struktura przesyłanego cennika towarów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Kod identyfikacyjny towaru  | Tekst (20)  |
| 2\.   | Nazwa ceny  | Tekst (20)  |
| 3\.   | Cena netto  | Kwota  |
| 4\.   | Cena brutto  | Kwota  |
| 5\.   | Narzut w procentach  | Kwota  |
| 6\.   | Marża w procentach  | Kwota  |
| 7\.   | Zysk  | Kwota  |

 

**Tabela 15 Struktura przesyłanych grup towarów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Kod identyfikacyjny towaru  | Tekst (20)  |
| 2\.   | Nazwa grupy  | Tekst (50)  |
| 3\.   | Numer analityki  | Tekst (3)  |

 

**Tabela 16 Struktura przesyłanych cech towarów.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Kod identyfikacyjny towaru  | Tekst (20)  |
| 2\.   | Nazwa cechy  | Tekst (50)  |

 

## 1.4.3. Kartoteka pracowników 

**Tabela 17 Struktura przesyłanej kartoteki pracowników.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Nazwisko  | Tekst (30)  |
| 2\.   | Pierwsze imię  | Tekst (20)  |
| 3\.   | Drugie imię  | Tekst (20)  |
| 4\.   | Imię matki  | Tekst (20)  |
| 5\.   | Imię ojca  | Tekst (20)  |
| 6\.   | Data urodzenia  | Data  |
| **Lp**  | **Opis**  | **Typ danych**  |
| 7\.   | Miejsce urodzenia  | Tekst (30)  |
| 8\.   | PESEL  | Tekst (11)  |
| 9\.   | NIP  | Tekst (13)  |
| 10\.   | Ulica  | Tekst (50)  |
| 11\.   | Numer domu  | Tekst (5)  |
| 12\.   | Numer lokalu  | Tekst (5)  |
| 13\.   | Kod pocztowy  | Tekst (6)  |
| 14\.   | Miasto  | Tekst (30)  |
| 15\.   | Gmina  | Tekst (30)  |
| 16\.   | Powiat  | Tekst (30)  |
| 17\.   | Województwo  | Tekst (30)  |
| 18\.   | Państwo  | Tekst (50)  |
| 19\.   | Telefon  | Tekst (50)  |
| 20\.   | Faks  | Tekst (50)  |
| 21\.   | Teleks  | Tekst (50)  |
| 22\.   | Poczta  | Tekst (30)  |
| 23\.   | Skrytka pocztowa  | Tekst (10)  |
| 24\.   | Data zatrudnienia  | Data  |
| 25\.   | Data zwolnienia (puste, jeśli pracownik pozostaje zatrudniony)  | Data  |
| 26\.   | Sposób zatrudnienia  \- bez umowy o pracę;  \- na podstawie umowy o pracę  | Bajt  |
| 27\.   | Typ ubezpieczenia ZUS  \- na starych zasadach (sprzed 1 stycznia 1999);  \- I filar;  \- I i II filar  | Bajt  |
| 28\.   | Analityka  | Tekst (5)  |

 

## 1.4.4. Kartoteka urzędów skarbowych 

**Tabela 18 Struktura przesyłanej kartoteki urzędów skarbowych.** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Nazwa  | Tekst (50)  |
| 2\.   | Ulica  | Tekst (50)  |
| 3\.   | Numer domu  | Tekst (5)  |
| 4\.   | Miasto  | Tekst (30)  |
| 5\.   | Kod pocztowy  | Tekst (6)  |
| 6\.   | Poczta  | Tekst (30)  |
| 7\.   | Analityka  | Tekst (5)  |
| 8\.   | Nazwa banku (z podstawowego rachunku bankowego urzędu)  | Tekst (50)  |
| 9\.   | Numer konta w banku (z podstawowego rachunku bankowego urzędu)  | Tekst (50)  |

 

## 1.4.5. Identyfikatory płatności masowych 

**Tabela 197 Struktura przesyłanych identyfikatorów płatności masowych (tylko Navireo) (pod format 1.05.2).** 

| Lp  | Opis  | Typ danych  |
| :---- | :---- | :---- |
| 1\.   | Pełny numer identyfikacji dokumentu (pierwsze maks. cztery znaki to mnemonik typu dokumentu i spacja)  | Tekst (30)  |
| 2\.   | Identyfikator płatności  | Tekst (50)  |
| 3\.   | Skrócony identyfikator płatności  | Tekst (50)  |
| 4\.   | Rachunek bankowy  | Tekst (50)  |

 

# ***1.5. Sposób przesyłania stawek podatku VAT*** 

Informacje o stawkach podatku VAT w większości przypadków przesyłane są za pomocą dwóch pól: symbolu identyfikującego stawkę oraz wartości określającej wysokość stawki. Poniżej przedstawiono możliwe wartości obu parametrów. 

Symbol identyfikujący stawkę podatku VAT: 

	„zw” 	\- zwolniony; 

	„ex” 	\- eksportowy; 

	„ue” 	\- unijny; 

„npo” 	\- nie podlegający odliczeniu; „oo” 	\- odwrotne obciążenie; symbolami innych stawek jest ich wartość numeryczna zamieniona na tekst, np. 

	“23” 	\- 23,00 % 

Wysokość stawki podatku VAT może przyjmować następujące wartości: 

| \-1,00  | \- zwolniony;  |
| :---- | :---- |
| \-2,00  | \- eksportowy;  |
| \-3,00  | \- unijny;  |
| \-4,00  | \- nie podlegający odliczeniu;  |
| \-5,00  | \- odwrotne obciążenie;  |

w przypadku pozostałych stawek jest to ich rzeczywista wartość, np. 

	23,00 	\- 23,00 % 

# ***1.6. Sposób i wymagania zapisu danych EDI++*** 

Do zapisu i odczytu danych EDI++ w pakiecie firmy InsERT został wykorzystany motor baz danych DAO Jet 3.5. Wykorzystywany jest do tego celu sterownik ISAM Text, który jest standardowo instalowany razem z programami z *Pakietu*. Przy jego wykorzystywaniu do czytania lub zapisu plików EDI++ wymagane jest ustawienie następujących wartości parametrów dla danego pliku komunikacji w pliku schematu **schema.ini**: 

\[*nazwa\_pliku*\]   
CharacterSet=ANSI   
Format=CSVDelimited MaxScanRows=0   
ColNameHeader=False   
DateTimeFormat=yyyymmddhhnnss   
CurrencySymbol=0   
CurrencyDigits=4   
CurrencyNegFormat=0   
CurrencyThousandSymbol= CurrencyDecimalSymbol=. DecimalSymbol=. 

Szczególnie istotne przy zapisywaniu danych jest ustawienie w rejestrze systemowym wartości  

HKEY\_LOCAL\_MACHINE\\ 

 	SOFTWARE\\ 

 	 	Microsoft\\ 

 	 	 	Jet\\ 

 	 	 	 	3.5\\ 

 	 	 	 	 	Engines\\ 

 	 	 	 	 	 	Text\\ 

 	 	 	 	 	 	 	ExportCurrencySymbols  na “00”.  

**Komunikacja z *Pakietu* wykonuje wszystkie te ustawienia automatycznie przy każdej próbie wysłania lub zapisania danych EDI++.** 

Takie użycie sterownika ISAM Text implikuje następujący format danych: 

* strona kodowa zgodna z ustawioną w Windows (1250), 

* przecinki rozdzielają kolejne pola w rekordzie, 

* format daty yyyymmddhhnnss (y-rok, m-miesiac, d-dzien, h-godzina, n-minuty, s-sekundy) 

* brak symbolu waluty w danych typu *kwota* 

* brak separatora tysięcznego • separator dziesiętny – “.” (kropka) 

*Koniec.* 