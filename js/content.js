// ============================================================
// Everything you are likely to edit lives in this file.
// Adding a paper, a tool, a news post or a career step means
// adding one object to the matching list below.
// ============================================================

const SITE = {
  orcid: '0000-0003-0727-5974',
  githubUser: 'Paururo',
  githubLab: 'PathoGenOmics-Lab',
  email: 'paula.ruiz.rodriguez@csic.es',
};

// ---------- Papers I led (first or co-first author) ----------
// The same list marks these papers as first or co-first author in the live
// publication list, and names the preprint server for preprints.
const SELECTED_WORK = [
  {
    year: 2026,
    venue: 'Microbial Genomics',
    role: 'Co-first author',
    pathogen: 'tb',
    title: 'Host-strain compatibility shapes host transcriptional responses in macrophage in vitro infection models of <em>Mycobacterium tuberculosis</em>',
    summary: 'In both human and bovine macrophages, the epidemiologically matched strain reached the higher bacterial load, while mismatched pairings switched on stronger immune signalling.',
    doi: '10.1099/mgen.0.001826',
  },
  {
    year: 2026,
    venue: 'bioRxiv, accepted in <em>Emerging Infectious Diseases</em>',
    server: 'bioRxiv',
    preprint: true,
    role: 'First author',
    pathogen: 'tb',
    title: 'Pathotypr: harmonised MTBC lineage assignment and resistance-associated variant detection for genomic surveillance',
    summary: 'An alignment-free tool that assigns all 14 recognised MTBC lineages and flags resistance-associated variants in about a second per sample, with 100% root-lineage agreement with TB-Profiler across 88,071 samples.',
    doi: '10.64898/2026.03.24.714002',
    links: [{ url: 'https://github.com/PathoGenOmics-Lab/pathotypr', label: 'Code', icon: 'fab fa-github' }],
  },
  {
    year: 2026,
    venue: 'medRxiv',
    server: 'medRxiv',
    preprint: true,
    role: 'First author',
    pathogen: 'cov',
    title: 'Paired wastewater and clinical genomics across metropolitan and hospital catchments reveals SARS-CoV-2 relevant mutations',
    summary: 'Hospital wastewater detected KP.3 about three months before it appeared in routine clinical surveillance of the metropolitan area.',
    doi: '10.64898/2026.03.31.26346553',
  },
  {
    year: 2022,
    venue: 'PLOS Pathogens',
    role: 'Co-first author',
    pathogen: 'cov',
    title: 'The structural role of SARS-CoV-2 genetic background in the emergence and success of spike mutations: the case of the spike A222V mutation',
    summary: 'A222V, the spike mutation that defined the 20E (EU1) variant, favours an open receptor-binding domain and slightly stronger ACE2 binding, and does not reduce neutralisation by sera.',
    doi: '10.1371/journal.ppat.1010631',
  },
  {
    year: 2021,
    venue: 'mBio',
    role: 'First author',
    pathogen: 'cov',
    title: 'Evolutionary and phenotypic characterization of two spike mutations in European lineage 20E of SARS-CoV-2',
    summary: 'Spike mutations at positions 1163 and 1167 arose again and again, yet lowered infectivity in vitro, consistent with the genotype carrying both being displaced when Alpha expanded.',
    doi: '10.1128/mBio.02315-21',
  },
];

// ---------- Tools ----------
// Public repositories only: a private one would link to a 404.
const FEATURED_TOOLS = [
  {
    name: 'pathotypr', lang: 'Rust', tag: 'TB surveillance',
    desc: 'Assigns MTBC genomes to lineages and genotypes resistance-associated markers, from assemblies or raw reads.',
    bioconda: 'pathotypr', docs: 'https://pathogenomics-lab.github.io/pathotypr/', repo: 'https://github.com/PathoGenOmics-Lab/pathotypr',
  },
  {
    name: 'get_MNV', lang: 'Rust', tag: 'Variant annotation',
    desc: 'Finds SNVs that fall in the same codon and reports the amino-acid change they cause together, from VCF or iVar output.',
    bioconda: 'get_mnv', docs: 'https://pathogenomics-lab.github.io/get_MNV/', repo: 'https://github.com/PathoGenOmics-Lab/get_MNV',
  },
  {
    name: 'snpick', lang: 'Rust', tag: 'Phylogenetics',
    desc: 'Pulls the variable sites out of whole-genome FASTA alignments with little memory, with ascertainment-bias correction for IQ-TREE and RAxML.',
    bioconda: 'snpick', docs: 'https://pathogenomics-lab.github.io/snpick/', repo: 'https://github.com/PathoGenOmics-Lab/snpick',
  },
  {
    name: 'fstic', lang: 'Rust', tag: 'Population genetics',
    desc: 'Pairwise genetic distances from allele frequencies (FST, GST, Jost’s D and five more), built for mixed infections and pooled samples.',
    bioconda: 'fstic', docs: 'https://pathogenomics-lab.github.io/fstic/', repo: 'https://github.com/PathoGenOmics-Lab/fstic',
  },
  {
    name: 'distree', lang: 'Rust', tag: 'Phylogenetics',
    desc: 'Distances between every pair of tips in a Newick tree, streamed so memory grows with the number of tips, not with its square.',
    bioconda: 'distree', docs: 'https://pathogenomics-lab.github.io/distree/', repo: 'https://github.com/PathoGenOmics-Lab/distree',
  },
  {
    name: 'eskaks', lang: 'Rust', tag: 'Molecular evolution',
    desc: 'Pairwise dN/dS (Ka/Ks) and per-gene pN/pS from codon alignments or VCF files, with interactive HTML reports.',
    bioconda: 'eskaks', docs: 'https://pathogenomics-lab.github.io/eskaks/', repo: 'https://github.com/PathoGenOmics-Lab/eskaks',
  },
  {
    name: 'mycolorsTB', lang: 'R', tag: 'Data visualisation',
    desc: 'Colour palettes for the MTBC lineages that plug straight into ggplot2 and ggtree.',
    cran: 'mycolorsTB', docs: 'https://pathogenomics-lab.github.io/mycolorsTB/', repo: 'https://github.com/PathoGenOmics-Lab/mycolorsTB',
  },
  {
    name: 'BAMpiro', lang: 'Nextflow', tag: 'Pipeline',
    desc: 'Bacterial short-read mapping, variant calling and lineage and drug-resistance typing, with interactive QC reports.',
    repo: 'https://github.com/PathoGenOmics-Lab/BAMpiro',
  },
];

// ---------- News ----------
const BLOG_POSTS = [
  {
    date: '2026-09-23',
    category: 'Paper',
    title: 'Host-strain compatibility in tuberculosis, now in Microbial Genomics',
    body: 'Different <em>M. tuberculosis</em> complex lineages favour different hosts, but the molecular basis of that preference is hard to study in vivo. With Marta Caballer-Gual, co-first author, we infected human and bovine macrophages with human- and animal-adapted strains. In each model the best-matched strain reached the higher bacterial load, and the host transcriptome leaned towards replication, repair and the cell cycle; mismatched pairings showed lower loads and stronger endosomal, antigen-presentation and immune signalling. We also followed phospholipase C: blocking it lowered bacterial burden and cell death in human macrophages but not in bovine ones.',
    links: [
      { url: 'https://doi.org/10.1099/mgen.0.001826', label: 'Read the paper', icon: 'fas fa-file-alt' },
    ],
  },
  {
    date: '2026-04-06',
    category: 'Preprint',
    title: 'What wastewater sees that clinical sequencing misses',
    body: 'Our new medRxiv preprint pairs 845 clinical and 22 wastewater SARS-CoV-2 genomes from Valencia, from both the metropolitan area and a hospital catchment. Metropolitan wastewater mirrored community circulation best, while hospital wastewater was noisier but picked up KP.3 about three months before routine clinical surveillance did. Combining association studies at regional, national and supranational scale with wastewater detection, we prioritise spike mutations worth watching, including one, S:V445P, that clinical sequencing missed.',
    links: [
      { url: 'https://doi.org/10.64898/2026.03.31.26346553', label: 'Read on medRxiv', icon: 'fas fa-file-alt' },
    ],
  },
  {
    date: '2026-03-24',
    category: 'Preprint',
    title: 'Pathotypr preprint is out on bioRxiv!',
    body: 'Our preprint <em>&ldquo;Pathotypr: harmonised MTBC lineage assignment and resistance-associated variant detection for genomic surveillance&rdquo;</em> is now available on bioRxiv. Pathotypr is an alignment-free tool that supports all 14 currently recognised MTBC lineages and WHO catalogue-based resistance calling, processing ~1 sample/second. Validated on 88,071 samples with 100% lineage concordance and high resistance prediction performance.',
    links: [
      { url: 'https://www.biorxiv.org/content/10.64898/2026.03.24.714002v1', label: 'Read on bioRxiv', icon: 'fas fa-file-alt' },
      { url: 'https://github.com/PathoGenOmics-Lab/pathotypr', label: 'Source code', icon: 'fab fa-github' },
    ],
  },
  {
    date: '2026-03-14',
    category: 'Update',
    title: 'Welcome to my new portfolio',
    body: "I've redesigned my personal website with a fresh, clean look. Here you'll find my publications, projects, and interactive experiments. Stay tuned for updates on my research and bioinformatics adventures.",
  },
];

// ---------- Career, drawn as a chromosome ----------
// start/end are decimal years; end: null means "until now".
// type 'edu' goes on the upper chromatid, 'exp' on the lower one; short is
// the label drawn on the chromosome.
const CAREER = [
  { type: 'edu', start: 2015.7, end: 2019.5, date: '2015 – 2019', short: 'BSc Biology', title: 'BSc in Biology', place: 'University of Valencia', detail: 'Molecular biology and genetics foundation' },
  { type: 'edu', start: 2019.7, end: 2021.5, date: '2019 – 2021', short: 'MSc Bioinformatics', title: 'MSc in Bioinformatics', place: 'University of Valencia', detail: 'Genomics, phylogenetics and computational biology' },
  { type: 'exp', start: 2020.85, end: 2021.45, date: 'Nov 2020 – Jun 2021', short: 'Technician, UV', title: 'Research Technician', place: 'University of Valencia, I2SysBio', detail: 'Bioinformatics analysis of pathogen genomes' },
  { type: 'exp', start: 2021.5, end: null, date: 'Jul 2021 – now', short: 'Technician, CSIC', title: 'Research Technician', place: 'CSIC, I2SysBio (PathoGenOmics Lab)', detail: 'Genomic surveillance, pipelines and open-source tools' },
  { type: 'edu', start: 2022.0, end: null, date: '2022 – 2026', short: 'PhD', title: 'PhD in Biodiversity & Evolutionary Biology', place: 'University of Valencia', detail: 'Thesis on the evolutionary genomics of M. tuberculosis and SARS-CoV-2 diversity' },
];

// ---------- Helices (drag to spin, click a node) ----------
const HELICES = [
  {
    canvasId: 'dnaResearchSkills',
    strandA: [
      { label: 'M. tuberculosis', title: 'Tuberculosis genomics', detail: 'Lineage diversity, host range and drug resistance in the M. tuberculosis complex' },
      { label: 'SARS-CoV-2', title: 'SARS-CoV-2 evolution', detail: 'Recurrent spike mutations, variants and genomic surveillance in the Valencian Community' },
      { label: 'Phylogenomics', title: 'Phylogenetics & phylogenomics', detail: 'Evolutionary relationships reconstructed from whole genomes' },
      { label: 'Resistance', title: 'Drug resistance', detail: 'Resistance-associated variants called against the WHO catalogue' },
      { label: 'Host-pathogen', title: 'Host-pathogen interaction', detail: 'Macrophage infection models read out with RNA-seq' },
      { label: 'Surveillance', title: 'Genomic surveillance', detail: 'Clinical and wastewater sequencing, compared side by side' },
      { label: 'Illustration', title: 'Scientific illustration', detail: 'Graphical abstracts, logos and outreach pieces' },
    ],
    strandB: [
      { label: 'Rust', title: 'Rust', detail: 'Fast, low-memory command-line tools, six of them on Bioconda' },
      { label: 'Python', title: 'Python', detail: 'Data analysis, pipeline scripts and automation' },
      { label: 'R', title: 'R', detail: 'Statistics, visualisation and an R package on CRAN (mycolorsTB)' },
      { label: 'Bash', title: 'Bash / Shell', detail: 'Unix scripting and HPC job automation' },
      { label: 'Workflows', title: 'Nextflow & Snakemake', detail: 'Reproducible, containerised pipelines' },
      { label: 'NGS tools', title: 'Bioinformatics tools', detail: 'IQ-TREE, RAxML, BEAST, BWA, SAMtools, Snippy' },
      { label: 'DevOps', title: 'DevOps', detail: 'Docker, Conda and Bioconda recipes, Git and GitHub Actions' },
    ],
    colorA: 'sage', colorB: 'blue',
  },
  {
    canvasId: 'dnaEducationExp',
    strandA: [
      { label: 'PhD', title: 'PhD in Biodiversity & Evolutionary Biology', year: '2022 – 2026', detail: 'University of Valencia' },
      { label: 'MSc', title: 'MSc in Bioinformatics', year: '2019 – 2021', detail: 'University of Valencia' },
      { label: 'BSc', title: 'BSc in Biology', year: '2015 – 2019', detail: 'University of Valencia' },
      { label: 'Thesis', title: 'PhD thesis', detail: 'Evolutionary genomics of pathogen diversity in Mycobacterium tuberculosis and SARS-CoV-2' },
      { label: 'Bioinformatics', title: 'Computational Biology', detail: 'Genomics & phylogenetics' },
      { label: 'Biology', title: 'Biological Sciences', detail: 'Molecular biology & genetics foundation' },
      { label: 'Valencia', title: 'University of Valencia', detail: 'Estudi General, founded 1499' },
    ],
    strandB: [
      { label: 'CSIC', title: 'Research Technician', year: 'Jul 2021 – Present', detail: 'CSIC – I2SysBio' },
      { label: 'I2SysBio', title: 'Research Technician', year: 'Nov 2020 – Jun 2021', detail: 'Univ. Valencia – I2SysBio' },
      { label: 'PathoGenOmics', title: 'PathoGenOmics Lab', detail: 'Bioinformatician in pathogen genomics' },
      { label: 'Pipelines', title: 'Bioinformatics Pipelines', detail: 'Snakemake & Nextflow workflows' },
      { label: 'Open source', title: 'Open-source tools', detail: 'Rust command-line tools published on Bioconda and CRAN' },
      { label: 'Sequencing', title: 'Genome Sequencing', detail: 'Illumina and Nanopore data processing & analysis' },
      { label: 'HPC', title: 'High-Performance Computing', detail: 'Linux, Slurm, cluster computing' },
    ],
    colorA: 'terra', colorB: 'ochre',
  },
];

// ---------- Lineage colours from mycolorsTB (classicTB palette) ----------
// https://github.com/PathoGenOmics-Lab/mycolorsTB
// The tool city (js/city.js): a stop per building, in the order the lines
// run. The tag is the building's name in the city; line, the colour of its
// label; sub, what it answers, shown when you point at it.
const CITY_STOPS = [
  { tag: 'reads', name: 'raw reads', line: 'none', sub: 'the sequencer' },
  { tag: 'BAMpiro', name: 'BAMpiro', line: 'hub', sub: 'the central station' },
  { tag: 'pathotypr', name: 'pathotypr', line: 'red', sub: 'who is it, what resists' },
  { tag: 'get_MNV', name: 'get_MNV', line: 'blue', sub: 'codons, together' },
  { tag: 'eskaks', name: 'eskaks', line: 'blue', sub: 'dN/dS, pN/pS' },
  { tag: 'snpick', name: 'snpick', line: 'green', sub: 'variable sites' },
  { tag: 'distree', name: 'distree', line: 'green', sub: 'tree distances' },
  { tag: 'fstic', name: 'fstic', line: 'ochre', sub: 'mixed infections' },
  { tag: 'mycolorsTB', name: 'mycolorsTB', line: 'plum', sub: 'lineage colours' },
  { tag: 'karyon', name: 'karyon', line: 'works', sub: 'under works' },
  { tag: 'depot', name: 'the depot', line: 'depot', sub: 'older and smaller' },
];
// Sagunt and its port, past the bridge in the same city: a building for each
// paper I led. The tag is the building; doi, its paper in SELECTED_WORK; line,
// the colour of its label (TB or SARS-CoV-2); sub, what it found.
const SAGUNTO_STOPS = [
  { tag: 'castell', doi: '10.64898/2026.03.24.714002', name: 'Pathotypr, 2026', line: 'tb', sub: 'the castle keeps watch' },
  { tag: 'masia', doi: '10.1099/mgen.0.001826', name: 'Host compatibility, 2026', line: 'tb', sub: 'people and cattle' },
  { tag: 'hospital', doi: '10.64898/2026.03.31.26346553', name: 'Wastewater, 2026', line: 'cov', sub: 'KP.3, three months early' },
  { tag: 'alt-forn', doi: '10.1371/journal.ppat.1010631', name: 'PLOS Pathogens, 2022', line: 'cov', sub: 'A222V opens the spike' },
  { tag: 'platja', doi: '10.1128/mBio.02315-21', name: 'mBio, 2021', line: 'cov', sub: 'mutations that kept coming back' },
];
// Paterna, past the bridge the other way, by tram: the Parc Cientific and I2SysBio, where I work.
const PATERNA_STOPS = [
  { tag: 'i2sysbio', name: 'I2SysBio', line: 'tram', sub: 'where I work, step inside' },
  { tag: 'xarxa', name: 'Researchers map', line: 'tram', sub: 'who works with whom' },
];
// Inside I2SysBio, through its door: the lab I work in, and my desk in it.
const LAB_STOPS = [
  { tag: 'pgl', name: 'PathoGenOmics Lab', line: 'lab', sub: 'the group I work in' },
  { tag: 'desk', name: 'my desk', line: 'lab', sub: 'in thesis mode' },
];

const MYCOLORS_TB = {
  L1: '#ff3091', L2: '#001aff', L3: '#8a0bd2', L4: '#ff0000', L5: '#995200', L6: '#1eb040', L7: '#fbff00',
  L8: '#ff9d00', L9: '#37ff30', L10: '#8fbda1', A1: '#d1ae00', A2: '#8ef5c8', A3: '#73c2ff', A4: '#ff9cdb',
};
const LINEAGE_NAMES = {
  L1: 'L1, Indo-Oceanic', L2: 'L2, East Asian', L3: 'L3, East African-Indian', L4: 'L4, Euro-American',
  L5: 'L5, West African 1', L6: 'L6, West African 2', L7: 'L7, Ethiopian', L8: 'L8, the earliest branch', L9: 'L9, the lineage our 2021 paper described',
  L10: 'L10', A1: 'A1, animal-adapted', A2: 'A2, animal-adapted', A3: 'A3, animal-adapted', A4: 'A4, animal-adapted',
};

// ---------- The tuberculosis complex, drawn as a half-circle phylogeny ----------
// The reference topology from mycolorsTB: fourteen lineages, each tip in
// its mycolorsTB colour.
const MTBC_NEWICK = '(L8,((L1,(L7,(L4,(L2,L3)))),(L5,((A2,(A3,A4)),(A1,(L10,(L6,L9)))))));';
