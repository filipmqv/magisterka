%
%  $Id: dcsarticle.cls 2764 2012-03-05 11:54:08Z sobaniec $
%

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{dcsarticle}[2012/03/01 v2.2 DCS Group article class]
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass{article}


\RequirePackage[a4paper]{geometry}
\RequirePackage[pagestyles,clearempty,psfloats]{titlesec}
\RequirePackage{dcslib}[2012/03/01]
\RequirePackage{subfig}
\RequirePackage{enumitem}


% default monospace font
\ifunicodeengine
  % can be obtained from http://www.fontsquirrel.com/fonts/DejaVu-Sans-Mono
  \setallmonofonts[Scale=MatchLowercase]{DejaVu Sans Mono}
\else
  \RequirePackage{lmodern}
  \RequirePackage[scaled=0.82]{beramono}
\fi

% default sectioning font
\newcommand{\secfont}{\sffamily}


% default page layout
\newlength{\bindinglen}
\setlength{\bindinglen}{0.5cm}
\geometry{tmargin=3cm,bmargin=3cm,lmargin=2.75cm,rmargin=2.75cm,
          bindingoffset=0cm}

% twoside
\DeclareOption{twoside}{
  \geometry{twoside=true,lmargin=2.5cm,rmargin=2.5cm,
            bindingoffset=\bindinglen}
}


% page styles
\newpagestyle{main}[\footnotesize\itshape]{
  \sethead{}{}{}
  \setfoot{}{\rm\normalsize\thepage}{}
  \setfloathead{}{}{}{\setheadrule{0pt}}[p]
}
\pagestyle{main}


% matters
\newif\if@mainmatter \@mainmattertrue
\newcommand\mainmatter{%
  \cleardoublepage
  \@mainmattertrue
  \pagenumbering{arabic}}
\newcommand\backmatter{%
  \if@openright
    \cleardoublepage
  \else
    \clearpage
  \fi
  \@mainmatterfalse}


\titleformat{\subparagraph}[runin]{\em}{}{0em}{}
\titlespacing{\subparagraph}{0pt}{\bigskipamount}{1em}

% sectioning
\DeclareOption{sanssec}{
  \titleformat{\section}{\secfont\bfseries\LARGE\filright}{\thesection}{1em}{}
  \titleformat{\subsection}{\secfont\bfseries\Large\filright}{\thesubsection}{1em}{}
  \titleformat{\subsubsection}{\secfont\bfseries\large\filright}{\thesubsubsection}{1em}{}
}

\DeclareOption{sanssecsmall}{
  \titleformat{\section}{\secfont\bfseries\Large\filright}{\thesection}{1em}{}
  \titleformat{\subsection}{\secfont\bfseries\large\filright}{\thesubsection}{1em}{}
  \titleformat{\subsubsection}{\secfont\bfseries\filright}{\thesubsubsection}{1em}{}
}

% report option
\DeclareOption{report}{
  \renewcommand{\and}{\par}
  \renewcommand{\maketitle}{%
    \begin{titlepage}
    \secfont
    \setlength{\parindent}{0pt}
    \null\vfill
    \hfill\begin{minipage}{12.5cm}
      \begin{center}
        {\fontsize{18}{20}\selectfont\@title\par}
        \fontsize{12}{14}\selectfont
        \vspace{5mm}
        {\@author}\par
        \vspace{5mm}
        {\fontsize{10}{12}\selectfont \techreportname\ \@date}
      \end{center}
    \end{minipage}\hspace{\bindinglen}\hfill\null
    \vfill\null
    \end{titlepage}
    \cleardoublepage
  }

  \renewcommand\tableofcontents{%
    \section*{\contentsname}
    \pagestyle{empty}
    \@starttoc{toc}
    \cleardoublepage
    \pagestyle{main}}

  % page layout
  \geometry{tmargin=3.5cm,bmargin=3cm,lmargin=2.75cm,rmargin=2.75cm,
            headsep=7ex,footskip=0cm,bindingoffset=\bindinglen}

  % line space
  \setstretch{1.1}

  \titleformat{\section}{\secfont\huge\filright}{\thesection}{1em}{}
  \titleformat{\subsection}{\secfont\LARGE\filright}{\thesubsection}{1em}{}
  \titleformat{\subsubsection}{\secfont\Large\filright}{\thesubsubsection}{1em}{}

  \setlength{\parindent}{1pc}
 
  % parskip
  \setlength{\parskip}{0.6ex}

  % page styles
  \renewpagestyle{plain}{
    \setfoot{}{}{}
  }
  \renewpagestyle{main}[\footnotesize\itshape]{
    \headrule
    \sethead[\rm\normalsize\thepage][]%
            [\if@mainmatter
               \thesection~~\sectiontitle
             \else
               \sectiontitle
             \fi]%
            {\if@mainmatter
               \thesection~~\sectiontitle
             \else
               \sectiontitle
             \fi}{}{\rm\normalsize\thepage}
    \setfloathead{}{}{}{\setheadrule{0pt}}[p]
  }
  \pagestyle{main}

  % abstract environment
  \renewenvironment{abstract}
    {
     \thispagestyle{plain}
     \mbox{}\vfill
     \begin{list}{}{
       \setlength{\leftmargin}{0.1\textwidth}
       \setlength{\rightmargin}{0.1\textwidth}
       \begin{center}
         \secfont\large\abstractname
       \end{center}
       }
       \item\relax
    }
    {\end{list}\vfill\vfill\vfill\mbox{}
     \cleardoublepage
    }

}


% shorttitle option
\DeclareOption{shorttitle}{
  \renewcommand{\and}{, }
  \renewcommand{\maketitle}{%
    \noindent
    \begin{minipage}{\linewidth}
    \sffamily
    {\huge\textbf{\scalebox{0.95}[1]{\@title}}\hfill\normalsize\@author}\par
    \textcolor{gray}{\rule[1.4ex]{\linewidth}{0.4pt}}\par
    \vspace{-2.0ex}
    \hfill{\textcolor{dkgray}{\scriptsize\@date}}\par
    \end{minipage}
    \vspace{8ex}
  }
}


% default colors
\lstset{language=c}
\lstset{keywordstyle=\bfseries\color{dkgreen},
        commentstyle=\itshape\color{dkblue},
        stringstyle=\color{dkred},
        directivestyle=\color{directive}}
\lstset{language=}


% B&W
\DeclareOption{bw}{
  \lstset{language=c}
  \lstset{keywordstyle=\bfseries,commentstyle=\itshape,
          stringstyle=,directivestyle=}
  \lstset{language=}
  \definecolor{directive}{rgb}{0, 0, 0}
  \definecolor{linkcolor}{rgb}{0, 0, 0}
  \definecolor{pathcolor}{rgb}{0, 0, 0}
  \definecolor{namecolor}{rgb}{0, 0, 0}
  \definecolor{cmdcolor}{rgb}{0, 0, 0}
  \definecolor{mancolor}{rgb}{0, 0, 0}
  \definecolor{codecolor}{rgb}{0, 0, 0}
}


% lists
\setlist{itemsep=0.5\itemsep,parsep=0.5\parsep,topsep=0.7\topsep}
\setlist[enumerate,2]{label=\alph*), ref=\theenumi\alph*}
\setlist[itemize,3]{label=$\cdot$}
\renewenvironment{quote}
  {\begin{itemize}[label=]\item\relax}
  {\end{itemize}}
\renewenvironment{center}
  {\begin{itemize}[label=,leftmargin=0pt]\item\relax\centering}
  {\end{itemize}}


% labeling environment
\newenvironment{labeling}[1][]%
  {\begin{description}[font=\normalfont,style=nextline,#1]}
  {\end{description}}


\ProcessOptions\relax
