import { ArrowUpRight } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { VisitorMap } from '@/components/visitor-map';
import { publications, getPublicationDate } from '@/lib/profile';

const scholarUrl =
  'https://scholar.google.com/citations?user=z5UpJ0IAAAAJ&hl=en';

export default function Home() {
  const sortedPublications = [...publications].sort((a, b) =>
    getPublicationDate(b).localeCompare(getPublicationDate(a)),
  );
  const years = [
    ...new Set(
      sortedPublications.map((paper) =>
        Number(getPublicationDate(paper).slice(0, 4)),
      ),
    ),
  ].sort((a, b) => b - a);
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page-layout">
        <header className="profile">
          <div className="profile-details">
            <div className="profile-identity">
              <h1>Zezhou Yang</h1>
            </div>
            <div className="profile-affiliation">
              <p className="affiliation">
                School of Computing and Data Science
              </p>
              <p className="affiliation">The University of Hong Kong</p>
            </div>
          </div>
          <div className="profile-toolbar">
            <nav className="profile-nav" aria-label="Page sections">
              <a href="#about">About</a>
              <a href="#publications">Publications</a>
              <a href="#service">Academic Service</a>
            </nav>
            <ThemeSwitcher />
          </div>
        </header>
        <main id="main">
          <section id="about" aria-labelledby="about-heading">
            <h2 id="about-heading">About me</h2>
            <p className="intro-text">
              I am a Ph.D. student in Computer Science at The University of Hong
              Kong, advised by{' '}
              <a
                className="advisor-link"
                href="https://i.cs.hku.hk/~cqian/"
                target="_blank"
                rel="noreferrer"
              >
                Chenxiong Qian
              </a>
              .
            </p>
            <p className="intro-text">
              My research interests broadly span{' '}
              <strong>artificial intelligence</strong> and{' '}
              <strong>software engineering</strong>. I am currently working on
              repository-level documentation generation, code optimization, and
              AI safety.
            </p>
            <p className="intro-text">
              Previously, I received my master’s degree in Computer Science and
              Technology from Harbin Institute of Technology, Shenzhen in 2025,
              advised by{' '}
              <a
                className="advisor-link"
                href="https://cuiyungao.github.io/"
                target="_blank"
                rel="noreferrer"
              >
                Cuiyun Gao
              </a>
              . I received my bachelor’s degree in Data Science and Big Data
              Technology from Lanzhou University in 2022.
            </p>
            <p className="intro-text collaboration-note">
              I’m always happy to explore collaborations and exchange ideas. If
              you have an interesting idea or would like to work together, feel
              free to reach out at{' '}
              <a href="mailto:zezhouyang@connect.hku.hk">
                zezhouyang@connect.hku.hk
              </a>
              .
            </p>
          </section>
          <section
            className="chapter"
            id="publications"
            aria-labelledby="publications-heading"
          >
            <div className="section-heading">
              <h3 id="publications-heading">Publications</h3>
            </div>
            <div className="publication-tools">
              <a href={scholarUrl} target="_blank" rel="noreferrer">
                Full list on Google Scholar{' '}
                <ArrowUpRight size={11} aria-hidden="true" />
              </a>
              <span className="author-note">* Equal contribution</span>
            </div>
            {years.map((year) => (
              <div className="publication-year" key={year}>
                <h4 className="year-label">{year}</h4>
                <div className="paper-list">
                  {sortedPublications
                    .filter(
                      (paper) =>
                        Number(getPublicationDate(paper).slice(0, 4)) === year,
                    )
                    .map((paper) => (
                      <article className="paper" key={paper.title}>
                        <div className="paper-venue">
                          <span>{paper.venue}</span>
                          <span className="paper-type">
                            {paper.publicationType}
                          </span>
                          <time
                            className="paper-date"
                            dateTime={getPublicationDate(paper)}
                            title={
                              paper.onlinePublishedDate
                                ? 'Published online'
                                : 'Proceedings publication'
                            }
                          >
                            {new Intl.DateTimeFormat('en', {
                              month: 'long',
                              timeZone: 'UTC',
                            }).format(new Date(getPublicationDate(paper)))}
                          </time>
                        </div>
                        <h5>
                          <a href={paper.url} target="_blank" rel="noreferrer">
                            {paper.title}
                          </a>
                        </h5>
                        <p className="paper-authors">
                          {paper.authors
                            .split(/(Zezhou Yang\*?)/)
                            .map((part, index) =>
                              part.startsWith('Zezhou Yang') ? (
                                <strong key={index}>{part}</strong>
                              ) : (
                                part
                              ),
                            )}
                        </p>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </section>
          <section
            className="chapter"
            id="service"
            aria-labelledby="service-heading"
          >
            <div className="section-heading">
              <h3 id="service-heading">Academic Service</h3>
            </div>
            <p className="intro-text">
              Reviewer for ESWA, TOSEM, TSE, and NeurIPS in 2026.
            </p>
          </section>
          <VisitorMap />
        </main>
      </div>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Zezhou Yang</span>
        <span>Last updated October 2026</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}
