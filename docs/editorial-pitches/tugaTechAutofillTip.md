# TugaTech source tip: Open Autofill Safety Corpus v1

Status: sent once to `contacto@tugatech.com.pt` on September 2, 2026 at 07:07
CEST after revalidating the official editorial route and every linked artifact.
Gmail's exact search shows one sent message and no matching draft.

Current route: TugaTech's current **Sobre nós** page designates
`contacto@tugatech.com.pt` for editorial suggestions. The site publishes
cybersecurity, privacy, open-source, and password-manager updates.

## Exact email

**To:** `contacto@tugatech.com.pt`

**Subject:** `Sugestão para a redação: corpus aberto para testar o preenchimento automático de palavras-passe e TOTP`

Olá equipa de redação do TugaTech,

Sou Jiří Špác, responsável pelo projeto Authier, um gestor de palavras-passe
AGPL ainda numa fase inicial. Gostaria de partilhar uma fonte técnica recente
para avaliação independente pela redação: o **Open Autofill Safety Corpus v1**.

O corpus transforma a escolha de campos para preenchimento automático de
palavras-passe e códigos TOTP num contrato de teste determinístico. Inclui seis
páginas sintéticas e 12 fases que abrangem um início de sessão apenas com
palavra-passe, registo e alteração de palavra-passe em que o gestor se deve
abster, campos TOTP únicos e segmentados, armadilhas com códigos de recuperação
e códigos de segurança de cartão, candidatos ambíguos e uma autenticação em
várias etapas que substitui os nós DOM.

Cada fase declara os identificadores exatos dos campos autorizados ou um
resultado explícito sem alvo. O código, o runner em TypeScript e o JSON
descarregável são públicos sob AGPL-3.0-or-later:

- Documentação:
  https://www.authier.pm/research/autofill-safety-corpus
- JSON:
  https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256:
  https://www.authier.pm/research/autofill-safety-corpus-v1.sha256
- Fonte imutável:
  https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

As limitações são importantes: a versão atual usa marcação sintética e jsdom.
Não testa escritas reais num navegador ou extensão, submissão de formulários,
rede, iframes entre origens, shadow roots fechados, scripts hostis, localização,
layout visual ou taxas de falsos positivos. Passar estes testes não constitui
uma garantia de compatibilidade nem uma auditoria de segurança.

Divulgação: sou responsável pelo Authier e desenvolvi este corpus no respetivo
repositório. O Authier está numa fase inicial e não foi submetido a uma auditoria
de segurança independente. Foi utilizada assistência de IA para rever a
implementação pública e estruturar e editar esta sugestão. Esta mensagem é
apenas uma fonte para o vosso critério editorial; não é um pedido de link,
cobertura garantida ou conteúdo patrocinado.

Obrigado pela consideração,

Jiří Špác
Authier

## Evidence and publication mechanics

- TugaTech's current mission explicitly covers cybersecurity and privacy and
  publishes a direct editorial-suggestions address.
- Its August 2026 AliasVault 0.29 news article cites the product's release note
  through a direct external anchor with only `rel="noopener"`; it has no
  `nofollow`, `ugc`, or `sponsored` value.
- Ahrefs' official Website Authority Checker reported `tugatech.com.pt` at
  **DR 46** on September 1, 2026, with about 175,000 backlinks from 1,600
  linking websites and 36% dofollow linking websites.

## Guardrails

- Do not present the source tag as a browser-store release.
- Do not describe Authier as independently audited, mature, self-hostable, or
  endorsed by TugaTech.
- Do not ask for placement in the existing AliasVault or Bitwarden articles, a
  backlink, guaranteed coverage, sponsorship, or paid placement.
- Recheck the current address, policy, recipient, subject, and exact Portuguese
  copy immediately before any send action.
