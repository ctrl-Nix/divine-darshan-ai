import { useState } from "react";
import PageShell from "@/components/PageShell";
import { Copy, Check } from "lucide-react";

const VERSES = [
  { s: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।", t: "karmaṇy-evādhikāras te mā phaleṣu kadācana", e: "You have the right to action alone, never to its fruits.", r: "2.47" },
  { s: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।", t: "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya", e: "Established in yoga, perform your duties, abandoning attachment.", r: "2.48" },
  { s: "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः।", t: "nainaṁ chindanti śastrāṇi nainaṁ dahati pāvakaḥ", e: "Weapons cannot cut the soul, nor fire burn it.", r: "2.23" },
  { s: "वासांसि जीर्णानि यथा विहाय।", t: "vāsāṁsi jīrṇāni yathā vihāya", e: "As one casts off worn-out clothes, the soul casts off worn-out bodies.", r: "2.22" },
  { s: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।", t: "yadā yadā hi dharmasya glānir bhavati bhārata", e: "Whenever dharma declines, I manifest Myself.", r: "4.7" },
  { s: "परित्राणाय साधूनां विनाशाय च दुष्कृताम्।", t: "paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām", e: "To protect the righteous and destroy the wicked, I appear age after age.", r: "4.8" },
  { s: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।", t: "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja", e: "Abandon all dharmas and surrender unto Me alone.", r: "18.66" },
  { s: "मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु।", t: "man-manā bhava mad-bhakto mad-yājī māṁ namaskuru", e: "Fix your mind on Me, be My devotee, worship Me, bow to Me.", r: "18.65" },
  { s: "अहं सर्वस्य प्रभवो मत्तः सर्वं प्रवर्तते।", t: "ahaṁ sarvasya prabhavo mattaḥ sarvaṁ pravartate", e: "I am the source of all; from Me everything proceeds.", r: "10.8" },
  { s: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।", t: "uddhared ātmanātmānaṁ nātmānam avasādayet", e: "Lift yourself by yourself; do not degrade yourself.", r: "6.5" },
  { s: "श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः।", t: "śraddhāvān labhate jñānaṁ tat-paraḥ saṁyatendriyaḥ", e: "The faithful, disciplined seeker attains knowledge.", r: "4.39" },
  { s: "योगः कर्मसु कौशलम्।", t: "yogaḥ karmasu kauśalam", e: "Yoga is skill in action.", r: "2.50" },
  { s: "समत्वं योग उच्यते।", t: "samatvaṁ yoga ucyate", e: "Equanimity of mind is called yoga.", r: "2.48" },
  { s: "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते।", t: "ananyāś cintayanto māṁ ye janāḥ paryupāsate", e: "Those who worship Me with undivided devotion, I personally carry what they lack.", r: "9.22" },
  { s: "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति।", t: "patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati", e: "Whoever offers Me a leaf, flower, fruit or water with love, I accept.", r: "9.26" },
  { s: "न हि कश्चित्क्षणमपि जातु तिष्ठत्यकर्मकृत्।", t: "na hi kaścit kṣaṇam api jātu tiṣṭhaty akarma-kṛt", e: "No one can remain even for a moment without performing action.", r: "3.5" },
  { s: "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।", t: "śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt", e: "Better one's own duty imperfect than another's well-performed.", r: "3.35" },
  { s: "क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।", t: "krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ", e: "From anger comes delusion; from delusion, loss of memory.", r: "2.63" },
  { s: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।", t: "dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate", e: "Contemplating sense objects gives rise to attachment.", r: "2.62" },
  { s: "बुद्धियुक्तो जहातीह उभे सुकृतदुष्कृते।", t: "buddhi-yukto jahātīha ubhe sukṛta-duṣkṛte", e: "One united in wisdom transcends both good and evil deeds here.", r: "2.50" },
  { s: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।", t: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ", e: "Sense contacts give heat and cold, pleasure and pain — endure them.", r: "2.14" },
  { s: "जातस्य हि ध्रुवो मृत्युर्ध्रुवं जन्म मृतस्य च।", t: "jātasya hi dhruvo mṛtyur dhruvaṁ janma mṛtasya ca", e: "For the born, death is certain; for the dead, birth is certain.", r: "2.27" },
  { s: "यो न हृष्यति न द्वेष्टि न शोचति न काङ्क्षति।", t: "yo na hṛṣyati na dveṣṭi na śocati na kāṅkṣati", e: "One who neither rejoices nor hates, grieves nor desires — is dear to Me.", r: "12.17" },
  { s: "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।", t: "adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca", e: "Free from hatred, friendly and compassionate to all beings — is dear to Me.", r: "12.13" },
  { s: "तुल्यनिन्दास्तुतिर्मौनी सन्तुष्टो येन केनचित्।", t: "tulya-nindā-stutir maunī santuṣṭo yena kenacit", e: "Equal in praise and blame, silent, content with anything — such a one is dear to Me.", r: "12.19" },
  { s: "अहिंसा सत्यमक्रोधस्त्यागः शान्तिरपैशुनम्।", t: "ahiṁsā satyam akrodhas tyāgaḥ śāntir apaiśunam", e: "Non-violence, truth, freedom from anger, renunciation, peace.", r: "16.2" },
  { s: "श्रद्धामयोऽयं पुरुषो यो यच्छ्रद्धः स एव सः।", t: "śraddhā-mayo 'yaṁ puruṣo yo yac-chraddhaḥ sa eva saḥ", e: "A person is made of faith — as their faith is, so are they.", r: "17.3" },
  { s: "मनः प्रसादः सौम्यत्वं मौनमात्मविनिग्रहः।", t: "manaḥ prasādaḥ saumyatvaṁ maunam ātma-vinigrahaḥ", e: "Serenity of mind, gentleness, silence, self-control — austerity of mind.", r: "17.16" },
  { s: "सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि।", t: "sarva-bhūta-stham ātmānaṁ sarva-bhūtāni cātmani", e: "One sees the Self in all beings and all beings in the Self.", r: "6.29" },
  { s: "तेषां सततयुक्तानां भजतां प्रीतिपूर्वकम्।", t: "teṣāṁ satata-yuktānāṁ bhajatāṁ prīti-pūrvakam", e: "To those ever-united with Me in loving devotion, I give the yoga of understanding.", r: "10.10" },
];

const VerseOfTheDay = () => {
  const [copied, setCopied] = useState(false);
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const v = VERSES[day % VERSES.length];

  const share = async () => {
    const text = `🪔 Verse of the Day — Bhagavad Gita ${v.r}\n\n${v.s}\n\n${v.t}\n\n"${v.e}"\n\nHare Krishna 🙏`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <PageShell title="Verse of the Day" subtitle="A daily drop of Gita wisdom">
      <div className="rounded-3xl glass-strong border border-[hsl(var(--divine-gold)/0.35)] p-7 sm:p-9 shloka-glow">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary/60 mb-5">
          Bhagavad Gita — {v.r}
        </p>
        <p
          className="font-display italic text-2xl sm:text-3xl leading-relaxed mb-5"
          style={{ color: "hsl(var(--divine-gold))" }}
        >
          {v.s}
        </p>
        <p className="font-body text-sm text-foreground/70 italic mb-5">{v.t}</p>
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-5" />
        <p className="font-body text-base text-foreground/90 leading-relaxed mb-7">
          {v.e}
        </p>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-divine text-primary-foreground text-sm font-medium shadow-divine"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Share this verse"}
        </button>
      </div>
    </PageShell>
  );
};

export default VerseOfTheDay;
