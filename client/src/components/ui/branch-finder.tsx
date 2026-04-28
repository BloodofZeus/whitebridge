import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  distance: number;
  isATM: boolean;
  services: string[];
  hours: { day: string; hours: string }[];
}

const sampleBranches: Branch[] = [
  {
    id: '1',
    name: 'Finora Bank - Downtown',
    address: '123 Main Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    phone: '(617) 555-0123',
    distance: 0.5,
    isATM: false,
    services: ['Personal Banking', 'Business Banking', 'Mortgage', 'Investment'],
    hours: [
      { day: 'Monday - Friday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
      { day: 'Sunday', hours: 'Closed' }
    ]
  },
  {
    id: '2',
    name: 'ATM - Financial District',
    address: '456 Federal Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02110',
    phone: '',
    distance: 0.8,
    isATM: true,
    services: ['24/7 ATM', 'Deposit Taking'],
    hours: [
      { day: 'All Week', hours: '24/7' }
    ]
  },
  {
    id: '3',
    name: 'Finora Bank - Back Bay',
    address: '789 Boylston Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02116',
    phone: '(617) 555-0456',
    distance: 1.2,
    isATM: false,
    services: ['Personal Banking', 'Commercial Banking', 'Wealth Management'],
    hours: [
      { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Saturday', hours: '9:00 AM - 3:00 PM' },
      { day: 'Sunday', hours: 'Closed' }
    ]
  },
  {
    id: '4',
    name: 'ATM - Harvard Square',
    address: '321 Harvard Avenue',
    city: 'Cambridge',
    state: 'MA',
    zipCode: '02138',
    phone: '',
    distance: 2.1,
    isATM: true,
    services: ['24/7 ATM', 'Multilingual Support'],
    hours: [
      { day: 'All Week', hours: '24/7' }
    ]
  }
];

export default function BranchFinder() {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState<Branch[]>(sampleBranches);
  const [filterType, setFilterType] = useState<'all' | 'branches' | 'atms'>('all');

  const handleSearch = () => {
    // Simulate search - in real app would use Google Maps API
    let filtered = sampleBranches;
    
    if (filterType === 'branches') {
      filtered = filtered.filter(b => !b.isATM);
    } else if (filterType === 'atms') {
      filtered = filtered.filter(b => b.isATM);
    }
    
    setSearchResults(filtered);
  };

  const getDirections = (branch: Branch) => {
    const address = `${branch.address}, ${branch.city}, ${branch.state} ${branch.zipCode}`;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-map-marker-alt text-finora-primary mr-2"></i>
            Find a Branch or ATM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Enter your address, city, or ZIP code"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button 
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-finora-primary hover:bg-finora-dark' : ''}
              >
                All
              </Button>
              <Button 
                variant={filterType === 'branches' ? 'default' : 'outline'}
                onClick={() => setFilterType('branches')}
                className={filterType === 'branches' ? 'bg-finora-primary hover:bg-finora-dark' : ''}
              >
                Branches
              </Button>
              <Button 
                variant={filterType === 'atms' ? 'default' : 'outline'}
                onClick={() => setFilterType('atms')}
                className={filterType === 'atms' ? 'bg-finora-primary hover:bg-finora-dark' : ''}
              >
                ATMs
              </Button>
            </div>
            <Button onClick={handleSearch} className="bg-finora-primary hover:bg-finora-dark">
              <i className="fas fa-search mr-2"></i>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4">
        {searchResults.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {branch.name}
                      </h3>
                      <Badge variant={branch.isATM ? 'secondary' : 'default'} className="mb-2">
                        {branch.isATM ? 'ATM' : 'Full Service Branch'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">{branch.distance} miles</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">
                      <i className="fas fa-map-marker-alt mr-2 text-finora-primary"></i>
                      {branch.address}<br />
                      <span className="ml-5">{branch.city}, {branch.state} {branch.zipCode}</span>
                    </p>
                    {branch.phone && (
                      <p className="text-gray-600">
                        <i className="fas fa-phone mr-2 text-finora-primary"></i>
                        <a href={`tel:${branch.phone}`} className="hover:text-finora-primary">
                          {branch.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Services Available:</h4>
                    <div className="flex flex-wrap gap-2">
                      {branch.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Hours:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {branch.hours.map((schedule, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{schedule.day}:</span>
                          <span>{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      onClick={() => getDirections(branch)}
                      className="w-full bg-finora-primary hover:bg-finora-dark"
                    >
                      <i className="fas fa-directions mr-2"></i>
                      Get Directions
                    </Button>
                    {!branch.isATM && (
                      <Button variant="outline" className="w-full">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        Schedule Appointment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or location.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}