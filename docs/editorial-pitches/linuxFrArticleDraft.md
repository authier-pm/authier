# LinuxFr collaborative article draft

Status: original technical draft, unsubmitted. This is suitable only as a
transparent collaborative-editing proposal—not as a product announcement or a
claim that the maintainer personally wrote the current text. LinuxFr's 2025
community poll recorded 77.4% opposition to AI-generated content. Although that
poll is not a formal submission rule, the maintainer must personally review,
substantially revise, and take responsibility for the article before any public
submission. Keep the AI-assistance disclosure.

## Form fields

- **Section:** `Sécurité` (internal value `46`)
- **Title:** `Autoremplissage : un corpus libre pour tester quand un gestionnaire de mots de passe doit s’abstenir`
- **Tags:** `gestionnaire_de_mots_de_passe sécurité navigateur_web test`
- **Urgent:** no
- **Licence:** CC By-SA 4.0 (currently selected by default)
- **Name:** maintainer name, maximum 32 characters; enter only after final-action confirmation
- **Email:** maintainer email, maximum 64 characters; enter only after final-action confirmation

## First part

L’autoremplissage d’un gestionnaire de mots de passe est une décision d’écriture
de secret. Reconnaître un simple `<input type="password">` ne suffit pas : une
page peut créer un compte, changer un mot de passe, demander un code de
récupération ou présenter plusieurs cibles également plausibles. Dans ces cas,
« ne rien remplir » est parfois le seul résultat prudent.

Authier, gestionnaire de mots de passe libre sous licence
AGPL-3.0-or-later, publie **Open Autofill Safety Corpus v1** : six scénarios
HTML synthétiques, douze phases déterministes, un schéma TypeScript, un lanceur,
un fichier JSON téléchargeable et un adaptateur qui interroge ses classifieurs de
production sans écrire de secret. Le corpus encode explicitement l’absence de
cible attendue.

**Transparence :** je maintiens Authier. OpenAI Codex a servi d’assistant pour
préparer et vérifier le corpus et son intégration, puis pour rechercher et
structurer cette dépêche. Je la propose en rédaction collaborative afin que le
fond et la forme puissent être discutés. Authier n’a publié aucun audit de
sécurité indépendant réalisé par un tiers ; ce corpus couvre une petite surface
de classification sous jsdom et ne constitue ni un audit, ni un banc d’essai
dans de vrais navigateurs.

## Second part

## Le problème n’est pas de trouver un champ de mot de passe

Un gestionnaire peut facilement repérer un champ dont le type HTML est
`password`. La décision difficile est de savoir ce que ce champ signifie et si
un secret déjà enregistré peut y être écrit.

Trois champs de mot de passe peuvent correspondre à l’ancien mot de passe, au
nouveau et à sa confirmation. Deux champs marqués `new-password` signalent
probablement une création de compte. Un formulaire à une seule étape peut ne
contenir que le mot de passe parce que l’identifiant a été demandé sur la page
précédente. Sans contexte suffisant, un champ isolé reste ambigu.

Le problème se répète avec les codes à usage unique. Un champ numérique de six
caractères peut recevoir un mot de passe à usage unique fondé sur le temps —
TOTP, pour _time-based one-time password_ — mais le mot « code » apparaît aussi
pour un code de récupération ou le code de sécurité d’une carte bancaire. Une
interface peut enfin répartir le TOTP entre six petites cases ou remplacer
entièrement son modèle objet de document (DOM) entre les étapes d’identification,
de mot de passe et de vérification.

Le résultat important n’est donc pas seulement « voici la cible ». Il faut aussi
pouvoir exprimer « aucune cible n’est suffisamment sûre ».

## Six scénarios, douze phases

La version 1 du corpus contient six scénarios :

1. une étape ne contenant que le mot de passe courant, après la collecte préalable de l’identifiant ;
2. une création de compte avec deux champs `new-password`, où aucun mot de passe enregistré ne doit être écrit ;
3. un changement de mot de passe avec ancien mot de passe, nouveau mot de passe et confirmation, également sans autoremplissage d’un secret enregistré ;
4. quatre cas autour des TOTP : un champ explicite, six cases ordonnées, un piège « code de récupération » et un code de sécurité de carte ;
5. deux ambiguïtés : un formulaire de mot de passe non annoté et deux champs TOTP de plausibilité égale ;
6. un parcours synthétique en trois phases qui remplace successivement les champs d’identifiant, de mot de passe et de TOTP.

Chaque page utilise un nom d’hôte réservé en `.invalid` et un petit fragment HTML
écrit à la main. Aucun formulaire réel n’a été copié et aucun identifiant réel
n’est présent.

Une phase déclare quatre résultats normalisés :

- la nature du formulaire de mot de passe : connexion, inscription, changement, inconnue ou absence de champ ;
- l’identifiant exact du champ autorisé à recevoir un mot de passe enregistré, ou `null` ;
- la forme du TOTP : champ unique, groupe segmenté ou absence ;
- la liste ordonnée des champs TOTP, qui peut être vide.

Par exemple, le cas volontairement ambigu attend ce résultat :

```json
{
  "passwordKind": "unknown",
  "storedPasswordTargetId": null,
  "otpKind": "none",
  "otpTargetIds": []
}
```

L’absence de cible n’est donc ni une erreur du lanceur ni un cas oublié : elle
fait partie du contrat.

## Un contrat déterministe et réutilisable

Le schéma, les scénarios et le lanceur sont séparés de l’adaptateur Authier. Un
autre projet peut monter chaque document synthétique, appliquer son propre
détecteur puis renvoyer la même structure d’observation.

Le lanceur :

1. vérifie l’unicité des identifiants ;
2. trie scénarios et phases par identifiant stable ;
3. demande à l’adaptateur de monter une phase ;
4. compare exactement la classification, la cible de mot de passe et les cibles TOTP ;
5. produit un rapport sans date, valeur aléatoire ni chemin dépendant de la machine.

À observations égales, deux exécutions doivent ainsi produire le même rapport.
Le JSON publié contient également la version, la licence et les limites du
corpus. Une somme SHA-256 séparée permet d’en vérifier les octets téléchargés.

Après installation des dépendances du dépôt, l’adaptateur Authier se vérifie
avec :

```sh
pnpm --dir web-extension exec vitest run src/content-script/autofillSafetyCorpus.spec.ts
```

Dans l’état de la branche principale vérifié le 1er septembre 2026, cette suite
ciblée comporte deux tests : le premier exige que les douze phases correspondent
exactement aux résultats attendus ; le second exige que deux exécutions
successives donnent le même rapport.

Cela prouve seulement que l’adaptateur actuel correspond à ce petit contrat. Ce
n’est pas une mesure indépendante de qualité ni de sécurité.

## Ce que l’adaptateur Authier observe

L’adaptateur appelle trois éléments utilisés par le code courant de l’extension :

- le classifieur de formulaire de mot de passe ;
- les détecteurs de TOTP à champ unique ou segmenté ;
- la politique commune qui choisit l’unique champ autorisé à recevoir un mot de passe enregistré.

Pour les mots de passe, les valeurs normalisées de l’attribut `autocomplete`
sont prioritaires. `current-password` et `new-password` permettent de distinguer
une connexion, une inscription et un changement de mot de passe sans dépendre de
la langue de la page.

En l’absence de ces annotations, le classifieur combine des signaux structurels :
chemin de l’adresse, attributs du formulaire, nombre de champs de mot de passe,
présence d’un candidat pour l’identifiant et présence d’un lien de déconnexion.
Les mots visibles comme « login », « continue », « save » ou « change password »
ne sont examinés que lorsque la langue primaire du document est explicitement
l’anglais. Sinon, cette couche est ignorée et la confiance ne peut pas être
élevée par ces mots.

La politique d’écriture est plus courte que le classifieur : elle ne renvoie le
champ de mot de passe courant que lorsque le formulaire a été classé comme
connexion. Une inscription, un changement de mot de passe ou un cas inconnu
renvoie `null`.

Pour les TOTP, un `autocomplete="one-time-code"` est un signal fort. Sans cet
attribut, le détecteur combine le nom, le mode de saisie numérique et la longueur
disponible. Les termes indiquant un code de récupération ou un code `CVV`, `CVC`
ou `CSC` de carte sont éliminatoires avant le classement.

Un groupe segmenté doit présenter une structure cohérente et au moins un signal
de corroboration : cases numériques, noms consécutifs, indices d’accessibilité,
conteneur évoquant un TOTP ou attribut explicite. Deux candidats à champ unique
obtenant le même score conduisent à l’abstention plutôt qu’à un choix selon
l’ordre du DOM.

Le corpus ne déclenche toutefois aucune écriture. Il observe les classifieurs et
la politique de sélection. D’autres tests du dépôt utilisent des valeurs
synthétiques pour exercer le chemin d’autoremplissage ; ils ne transforment pas
ce corpus en test de navigateur réel.

## Une portée volontairement plus petite que les travaux existants

Ce corpus n’est pas le premier travail public sur l’autoremplissage.

Mozilla maintient des [exemples de formulaires](https://github.com/mozilla/form-fill-examples).
Le projet [Browser Interactions Testing de Bitwarden](https://github.com/bitwarden/browser-interactions-testing)
exécute des scénarios statiques et certaines pages réelles avec une extension.
L’article USENIX Security 2020 [« That Was Then, This Is Now »](https://www.usenix.org/conference/usenixsecurity20/presentation/oesch)
étudie la génération, le stockage et l’autoremplissage de treize gestionnaires.
L’artefact [Leaky Autofill](https://github.com/Leaky-Autofill/LeakyAutofill-Artifact),
présenté à l’ACSAC 2024, examine notamment le remplissage de champs dissimulés.

La version 1 publiée ici est beaucoup plus petite. Son objectif est de fournir un
contrat lisible et adaptable pour la classification, l’ordre des cibles et
l’abstention. Elle ne remplace ni une suite d’intégration avec extension
empaquetée, ni une étude empirique.

## Ce que le corpus ne permet pas de conclure

Le corpus s’exécute sous jsdom. Il ne lance ni Chromium, ni Firefox, ni
l’extension empaquetée. Il ne couvre pas :

- les permissions de l’extension ou l’isolation entre la page et le script de contenu ;
- l’écriture, l’envoi ou la soumission d’un mot de passe ou d’un TOTP ;
- les requêtes réseau ;
- les différences entre moteurs de navigateur ;
- les cadres d’origine différente ;
- les racines Shadow DOM fermées ;
- les scripts de page hostiles ;
- la disposition visuelle ;
- les heuristiques de langues autres que les annotations HTML déjà normalisées ;
- un échantillon mesuré de formulaires réels.

Une réussite ne fournit donc aucun taux de faux positif, aucune garantie de
compatibilité et aucune conclusion sur la sécurité générale d’Authier.

Le corpus et son adaptateur ont été intégrés à la branche principale le 1er
septembre 2026, après la dernière étiquette publique de l’extension,
`v1.2.10-extension`, datée du 14 août. Ils décrivent l’arborescence source
actuelle ; ils ne démontrent pas que les versions actuellement distribuées par
les boutiques contiennent exactement ce code.

Enfin, Authier est un projet encore jeune et n’a publié aucun audit indépendant
réalisé par un tiers. Le code public est une matière à inspecter, pas un
certificat.

## Les prochaines couches utiles

La suite logique serait un adaptateur exécutant une extension empaquetée dans un
vrai Chromium, puis des corpus séparés pour les racines Shadow DOM ouvertes, les
cadres d’origine différente, les langues et les scripts hostiles.

Il serait préférable de conserver ces résultats séparés. Mélanger des attentes
synthétiques déterministes avec des observations de pages réelles rendrait plus
difficile de savoir si une régression vient du classifieur, du navigateur ou
d’un site qui a changé.

Les contributions peuvent rester petites : un formulaire synthétique minimal,
l’observation attendue et une explication de la décision d’écriture ou
d’abstention. Il ne faut transmettre ni identifiants réels, ni capture de page
privée.

## Links for “Aller plus loin”

| Name                                          | URL                                                                                                           | Language     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------ |
| Open Autofill Safety Corpus v1                | https://www.authier.pm/research/autofill-safety-corpus                                                        | Anglais      |
| Corpus JSON v1                                | https://www.authier.pm/research/autofill-safety-corpus-v1.json                                                | Code/binaire |
| Empreinte SHA-256                             | https://www.authier.pm/research/autofill-safety-corpus-v1.sha256                                              | Code/binaire |
| Sources typées du corpus et du lanceur        | https://github.com/authier-pm/authier/tree/main/research/autofill-safety                                      | Code/binaire |
| Adaptateur Authier                            | https://github.com/authier-pm/authier/blob/main/web-extension/src/content-script/autofillSafetyCorpus.spec.ts | Code/binaire |
| Architecture et limites de sécurité d’Authier | https://www.authier.pm/security                                                                               | Anglais      |
| Exemples de formulaires de Mozilla            | https://github.com/mozilla/form-fill-examples                                                                 | Code/binaire |
| Browser Interactions Testing de Bitwarden     | https://github.com/bitwarden/browser-interactions-testing                                                     | Code/binaire |
| Étude USENIX Security 2020                    | https://www.usenix.org/conference/usenixsecurity20/presentation/oesch                                         | Anglais      |
| Artefact Leaky Autofill                       | https://github.com/Leaky-Autofill/LeakyAutofill-Artifact                                                      | Code/binaire |

## Moderation note

Je maintiens Authier et propose cette dépêche pour son contenu technique sur la
classification et l’abstention, pas comme communiqué de lancement. OpenAI Codex
a été utilisé comme assistant pour préparer et vérifier le corpus et son
intégration, puis pour rechercher et structurer le présent brouillon. Je souhaite
une relecture et des corrections en rédaction collaborative avant soumission à
la modération.

Authier n’a publié aucun audit de sécurité indépendant réalisé par un tiers. Le
corpus est synthétique, s’exécute sous jsdom et a été intégré à la branche
principale après la dernière étiquette publique de l’extension ; le texte le
précise afin de ne pas assimiler ce résultat à une validation des binaires
distribués.

Le texte est original pour LinuxFr.org, non urgent, et peut être modifié sous CC
By-SA 4.0.
