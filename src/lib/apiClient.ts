const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

const apiClient = {
  get: async (url: string, params?: Record<string, any>) => {
    let finalUrl = url;
    if (params) {
      // Filter out undefined or null values from params
      const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const searchParams = new URLSearchParams(filteredParams);
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl = `${url}?${queryString}`;
      }
    }
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return response.json();
  },
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return response.json();
  },
  patch: async (url: string, data: any) => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
  },
  delete: async (url: string) => {
      const response = await fetch(url, {
          method: 'DELETE',
          headers,
          credentials: 'include',
      });
      return response.json();
  }
};

export default apiClient;