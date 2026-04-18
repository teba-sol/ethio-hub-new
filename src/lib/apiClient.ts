const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

const apiClient = {
  get: async (url: string, params?: Record<string, any>) => {
    try {
      let finalUrl = url;
      if (params && typeof params === 'object') {
        const filteredParams = (Object.entries(params) as [string, any][]).reduce((acc, [key, value]) => {
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
    } catch (e: any) {
      console.error('API GET error:', e);
      return { success: false, message: e.message };
    }
  },
  post: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    } catch (e: any) {
      console.error('API POST error:', e);
      return { success: false, message: e.message };
    }
  },
  put: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    } catch (e: any) {
      console.error('API PUT error:', e);
      return { success: false, message: e.message };
    }
  },
  patch: async (url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    } catch (e: any) {
      console.error('API PATCH error:', e);
      return { success: false, message: e.message };
    }
  },
  delete: async (url: string) => {
    try {
      const response = await fetch(url, {
          method: 'DELETE',
          headers,
          credentials: 'include',
      });
      return response.json();
    } catch (e: any) {
      console.error('API DELETE error:', e);
      return { success: false, message: e.message };
    }
  }
};

export default apiClient;