import { useState, useEffect } from 'react';
import { Card, Table, Spinner, Alert } from 'react-bootstrap';
import './RoadmapsList.css';

const RoadmapsList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGithubFiles = async () => {
      try {
        setLoading(true);
        
        // Create headers with authentication if you have a GitHub token
        const headers = new Headers();
        
        // If you have a GitHub token, uncomment the following line
        // headers.append('Authorization', `token ${process.env.REACT_APP_GITHUB_TOKEN}`);
        
        // Add Accept header to specify GitHub API version
        headers.append('Accept', 'application/vnd.github.v3+json');
        
        // Add a unique parameter to avoid caching issues
        const timestamp = new Date().getTime();
        
        // Fetch the list of files from the GitHub repository
        const response = await fetch(
          `https://api.github.com/repos/niat-web/Roadmaps/contents?timestamp=${timestamp}`, 
          { headers }
        );
        
        // Check for specific error status codes
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining && parseInt(rateLimitRemaining) === 0) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
          } else {
            throw new Error('Access forbidden. This might be a private repository or requires authentication.');
          }
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch GitHub files: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Get additional data for each file to retrieve created date
        const fileDetailsPromises = data
          .filter(item => item.name.endsWith('.html'))
          .map(async (item) => {
            try {
              // Get commit history for the file to find creation date
              const commitResponse = await fetch(
                `https://api.github.com/repos/niat-web/Roadmaps/commits?path=${item.path}&page=1&per_page=1&timestamp=${timestamp}`,
                { headers }
              );
              
              if (!commitResponse.ok) {
                console.warn(`Could not fetch commit history for ${item.name}`);
                return {
                  name: item.name.replace('.html', ''),
                  publishedLink: `https://niat-web.github.io/Roadmaps/${item.name}`,
                  createdDate: 'Unknown'
                };
              }
              
              const commits = await commitResponse.json();
              let createdDate = 'Unknown';
              
              if (commits && commits.length > 0) {
                // Format the date from the first commit (which should be the creation date)
                const date = new Date(commits[0].commit.author.date);
                createdDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              }
              
              return {
                name: item.name.replace('.html', ''),
                publishedLink: `https://niat-web.github.io/Roadmaps/${item.name}`,
                createdDate
              };
            } catch (err) {
              console.warn(`Error fetching commit info for ${item.name}:`, err);
              return {
                name: item.name.replace('.html', ''),
                publishedLink: `https://niat-web.github.io/Roadmaps/${item.name}`,
                createdDate: 'Unknown'
              };
            }
          });
        
        const fileList = await Promise.all(fileDetailsPromises);
        setFiles(fileList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching GitHub files:', err);
        setError(err.message || 'Failed to load roadmap files. Please try again later.');
        setLoading(false);
      }
    };

    fetchGithubFiles();
  }, []);

  // Alternative approach - if GitHub API doesn't work, 
  // you could implement a fallback to use a local JSON file or your own backend
  const fetchLocalFallback = () => {
    // This is a placeholder for an alternative approach
    // You could implement this to fetch data from your own backend
    // or a static JSON file if GitHub API continues to have issues
  };

  return (
    <Card className="roadmaps-list-card">
      <Card.Header className="roadmaps-card-header">
        <h2 className="roadmaps-list-title">Available Roadmaps</h2>
        <p className="roadmaps-list-subtitle">
          Click on any roadmap to view it in a new tab
        </p>
      </Card.Header>
      <Card.Body className="p-0">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="m-3">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <div className="loading-container">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3">Loading roadmaps...</p>
          </div>
        ) : files.length > 0 ? (
          <div className="table-responsive">
            <Table className="roadmaps-table">
              <thead>
                <tr>
                  <th>ROADMAP NAME</th>
                  <th>PUBLISHED LINK</th>
                  <th>CREATED DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index}>
                    <td className="roadmap-name">{file.name}</td>
                    <td className="roadmap-link">
                      <a href={file.publishedLink} target="_blank" rel="noopener noreferrer">
                        {file.publishedLink}
                      </a>
                    </td>
                    <td className="roadmap-date">{file.createdDate}</td>
                    <td>
                      <a 
                        href={file.publishedLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-roadmap-btn"
                      >
                        <i className="fas fa-external-link-alt me-2"></i>
                        View Roadmap
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-folder-open empty-state-icon"></i>
            <h4>No Roadmaps Found</h4>
            <p>There are no roadmap files available in the repository.</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RoadmapsList;